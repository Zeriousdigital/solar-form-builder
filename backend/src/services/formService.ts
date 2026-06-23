import prisma from '../prisma/client'
import { validateFormField } from '../utils/validators'

export const validateFormData = (data: any): string | null => {
  if (!data.name || typeof data.name !== 'string') {
    return 'Form name is required and must be a string'
  }
  if (data.fields && !Array.isArray(data.fields)) {
    return 'Fields must be an array'
  }
  if (data.fields && Array.isArray(data.fields)) {
    for (const field of data.fields) {
      const fieldError = validateFormField(field)
      if (fieldError) return fieldError
    }
  }
  return null
}

export const getPublishedForm = async (id: string) => {
  const form = await prisma.form.findFirst({
    where: { id, isPublished: true }
  })
  return form
}

export const formatFormResponse = (form: any) => {
  const schema = form.schema as any
  return {
    id: form.id,
    name: form.name,
    description: form.description,
    isPublished: form.isPublished,
    fields: schema.fields || [],
    settings: schema.settings || {},
    createdAt: form.createdAt,
    updatedAt: form.updatedAt
  }
}
