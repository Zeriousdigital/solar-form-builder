import { Request, Response, NextFunction } from 'express'
import prisma from '../prisma/client'
import { validateFormData, formatFormResponse } from '../services/formService'

export const getAllForms = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const forms = await prisma.form.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: forms })
  } catch (error) {
    next(error)
  }
}

export const getFormById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const form = await prisma.form.findUnique({
      where: { id }
    })
    if (!form) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }
    res.json({ success: true, data: form })
  } catch (error) {
    next(error)
  }
}

export const createForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, fields, settings, isPublished } = req.body

    const validationError = validateFormData({ name, fields })
    if (validationError) {
      res.status(400).json({ success: false, error: validationError })
      return
    }

    const form = await prisma.form.create({
      data: {
        name,
        description: description || null,
        schema: { fields: fields || [], settings: settings || {} },
        isPublished: isPublished || false
      }
    })
    res.status(201).json({ success: true, data: form })
  } catch (error) {
    next(error)
  }
}

export const updateForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description, fields, settings, isPublished } = req.body

    const existing = await prisma.form.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }

    const existingSchema = existing.schema as any
    const form = await prisma.form.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        schema: {
          fields: fields !== undefined ? fields : existingSchema.fields || [],
          settings: settings !== undefined ? settings : existingSchema.settings || {}
        },
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished
      }
    })
    res.json({ success: true, data: { ...form, schema: JSON.parse(form.schema) } })
  } catch (error) {
    next(error)
  }
}

export const deleteForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.form.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }
    await prisma.form.delete({ where: { id } })
    res.json({ success: true, message: 'Form deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const publishForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.form.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }
    const form = await prisma.form.update({
      where: { id },
      data: { isPublished: true }
    })
    res.json({ success: true, data: form })
  } catch (error) {
    next(error)
  }
}

export const draftForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await prisma.form.findUnique({ where: { id } })
    if (!existing) {
      res.status(404).json({ success: false, error: 'Form not found' })
      return
    }
    const form = await prisma.form.update({
      where: { id },
      data: { isPublished: false }
    })
    res.json({ success: true, data: form })
  } catch (error) {
    next(error)
  }
}
