import { Request, Response, NextFunction } from 'express'
import prisma from '../prisma/client'
import { sendToCAPI } from '../services/metaService'
import { validateSubmission, sanitizeSubmissionData, extractContactInfo } from '../services/submissionService'

export const createSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { formId, submissionData, isQualified, qualifyingScore, qualifyingTotal } = req.body

    const validationError = validateSubmission({ formId, submissionData })
    if (validationError) {
      res.status(400).json({ success: false, error: validationError })
      return
    }

    const form = await prisma.form.findUnique({ where: { id: formId } })
    if (!form) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }

    if (!form.isPublished) {
      res.status(400).json({ success: false, error: 'Form is not published' })
      return
    }

    const sanitizedData = sanitizeSubmissionData(submissionData)

    const submission = await prisma.formResponse.create({
      data: {
        formId,
        submissionData: sanitizedData,
        isQualified: isQualified || false,
        qualifyingScore: qualifyingScore ?? 0,
        qualifyingTotal: qualifyingTotal ?? 0
      }
    })

    const contactInfo = extractContactInfo(sanitizedData)
    if (    contactInfo.email || contactInfo.phone || contactInfo.name) {
      const formSchema = form.schema as any
      const formPixelId = formSchema?.settings?.metaPixelId || undefined
      const formAccessToken = formSchema?.settings?.metaAccessToken || undefined
      const capiData: any = {
        userData: {
          email: contactInfo.email,
          phone: contactInfo.phone,
          name: contactInfo.name
        },
        customData: {
          form_name: form.name,
          is_qualified: isQualified || false,
          form_id: formId,
          submission_id: submission.id
        },
        eventSourceUrl: req.headers.referer as string || undefined,
        pixelId: formPixelId,
        accessToken: formAccessToken,
        clientIpAddress: req.headers['x-forwarded-for'] as string || req.ip || '',
        clientUserAgent: req.headers['user-agent'] || ''
      }
      if (isQualified) {
        sendToCAPI({
          ...capiData,
          eventName: 'QualifiedLead'
        }).catch((err: Error) => {
          console.warn('CAPI QualifiedLead event failed (non-blocking):', err.message)
        })
      }
    }

    res.status(201).json({ success: true, data: submission })
  } catch (error) {
    next(error)
  }
}

export const getFormSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { formId } = req.params
    const form = await prisma.form.findUnique({ where: { id: formId } })
    if (!form) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }
    const submissions = await prisma.formResponse.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: submissions })
  } catch (error) {
    next(error)
  }
}
