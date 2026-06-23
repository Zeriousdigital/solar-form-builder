import type { FormField } from '../types'

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const re = /^\+?[\d\s-]{7,15}$/
  return re.test(phone)
}

export const getWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export const createFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const parseFormSchema = (formData: any): { fields: any[]; settings: any } => {
  if (!formData) return { fields: [], settings: {} }
  if (formData.fields) {
    return { fields: formData.fields, settings: formData.settings || {} }
  }
  const schema = typeof formData.schema === 'string'
    ? JSON.parse(formData.schema)
    : formData.schema || {}
  return {
    fields: schema.fields || [],
    settings: schema.settings || {}
  }
}

export const getProgressPercent = (current: number, total: number): number => {
  if (total <= 0) return 0
  return (current / total) * 100
}

export const calculateQualifyingScore = (
  fields: FormField[],
  answers: Record<string, any>
): { score: number; total: number } => {
  const qualifyingFields = fields.filter(f => f.isQualifying)
  let score = 0
  for (const field of qualifyingFields) {
    const userAnswer = answers[field.id]
    const correctAnswers = field.correctAnswers || []
    if (!correctAnswers.length) continue
    if (field.type === 'checkbox') {
      const userSelected = (Array.isArray(userAnswer) ? userAnswer : []).sort()
      const correct = [...correctAnswers].sort()
      if (userSelected.length === correct.length && userSelected.every((v, i) => v === correct[i])) {
        score++
      }
    } else {
      if (correctAnswers.includes(String(userAnswer ?? ''))) score++
    }
  }
  return { score, total: qualifyingFields.length }
}

export const isAnswerFieldType = (type: string): boolean => {
  return ['multiple_choice', 'checkbox', 'dropdown'].includes(type)
}

export const hasCorrectAnswerSupport = (type: string): boolean => {
  return ['multiple_choice', 'checkbox', 'dropdown', 'short_answer', 'numeric'].includes(type)
}

export const buildWhatsAppMessage = (
  fields: FormField[],
  answers: Record<string, any>,
  contact: { name?: string; email?: string; phone?: string }
): string => {
  const parts: string[] = []

  fields.forEach(field => {
    const answer = answers[field.id]
    if (answer === undefined || answer === null || answer === '') return

    const label = field.label.trim()
    const val = Array.isArray(answer) ? answer.join(', ') : String(answer)

    const lower = label.toLowerCase()
    if (lower.startsWith('do you') || lower.startsWith('does your') || lower.startsWith('are you') || lower.startsWith('is your')) {
      const rest = label.replace(/^(do you|does your|are you|is your)\s+/i, '').trim()
      if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'true') {
        parts.push(`I do ${rest}`)
      } else if (val.toLowerCase() === 'no' || val.toLowerCase() === 'false') {
        parts.push(`I don't ${rest}`)
      } else {
        parts.push(`${label} - ${val}`)
      }
    } else {
      parts.push(`My ${label.toLowerCase()} is ${val}`)
    }
  })

  if (contact.name) parts.push(`My name is ${contact.name}`)
  if (contact.email) parts.push(`my email is ${contact.email}`)
  if (contact.phone) parts.push(`and my phone is ${contact.phone}`)

  return parts.join(', ').replace(/,([^,]*and[^,]*)$/, ' $1')
}
