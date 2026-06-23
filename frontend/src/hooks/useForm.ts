import { useState, useEffect, useCallback } from 'react'
import { formsApi } from '../services/api'
import type { FormDefinition } from '../types'

export const useForm = (formId: string) => {
  const [form, setForm] = useState<FormDefinition | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchForm = useCallback(async () => {
    if (!formId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const response = await formsApi.getById(formId)
      const formData = response.data.data
      const parsedSchema = typeof formData.schema === 'string'
        ? JSON.parse(formData.schema)
        : formData.schema
      setForm({
        ...formData,
        fields: parsedSchema?.fields || [],
        settings: parsedSchema?.settings || formData.settings || {}
      })
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Failed to load form'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    fetchForm()
  }, [fetchForm])

  return { form, loading, error, refetch: fetchForm }
}
