export const validateSubmission = (data: any): string | null => {
  if (!data.formId) return 'formId is required'
  if (!data.submissionData) return 'submissionData is required'
  if (typeof data.submissionData !== 'object') return 'submissionData must be an object'
  if (Array.isArray(data.submissionData)) return 'submissionData must be an object, not an array'
  return null
}

export const sanitizeSubmissionData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim()
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const extractContactInfo = (data: Record<string, any>): { name?: string; email?: string; phone?: string } => {
  const name = data.name || data.Name || data['Full Name'] || data.full_name || data.fullName
  const email = data.email || data.Email || data['Email Address'] || data.email_address
  const phone = data.phone || data.Phone || data['Phone Number'] || data.phone_number || data.phoneNumber
  return {
    name: typeof name === 'string' ? name : undefined,
    email: typeof email === 'string' ? email : undefined,
    phone: typeof phone === 'string' ? phone : undefined
  }
}
