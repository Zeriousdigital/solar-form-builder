import { useState } from 'react'
import { submissionsApi } from '../services/api'
import { fbq } from '../services/meta'

export const useSubmission = (formId: string) => {
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const submitForm = async (
    answers: Record<string, any>,
    isQualified: boolean = false
  ) => {
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(false)

      if (isQualified) {
        fbq.trackCustom('QualifiedLead', {
          form_id: formId,
          timestamp: new Date().toISOString()
        })
      }

      const response = await submissionsApi.submit(formId, {
        submissionData: answers,
        isQualified
      })

      fbq.track('Lead', {
        form_id: formId,
        is_qualified: isQualified,
        timestamp: new Date().toISOString()
      })

      setSuccess(true)
      return response.data
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Failed to submit form'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setSuccess(false)
    setError(null)
    setSubmitting(false)
  }

  return { submitForm, submitting, error, success, reset }
}
