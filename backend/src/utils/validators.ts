export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`
  }
  return null
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const re = /^\+?[\d\s-]{7,15}$/
  return re.test(phone)
}

export const validateFormField = (field: any): string | null => {
  if (!field.id) return 'Field id is required'
  if (!field.label) return 'Field label is required'
  if (!field.type) return 'Field type is required'
  const validTypes = ['multiple_choice', 'checkbox', 'dropdown', 'short_answer', 'numeric', 'date', 'email', 'phone']
  if (!validTypes.includes(field.type)) {
    return `Invalid field type: ${field.type}`
  }
  if (['multiple_choice', 'checkbox', 'dropdown'].includes(field.type)) {
    if (!field.options || field.options.length === 0) {
      return `Field "${field.label}" requires at least one option`
    }
  }
  return null
}
