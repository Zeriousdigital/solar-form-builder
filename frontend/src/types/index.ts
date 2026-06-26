export interface FormField {
  id: string
  type: 'multiple_choice' | 'checkbox' | 'dropdown' | 'short_answer' | 'numeric' | 'date' | 'email' | 'phone'
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
  isQualifying?: boolean
  correctAnswers?: string[]
  disqualifyingAnswers?: string[]
  conditions?: FieldCondition[]
}

export interface FieldCondition {
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number | boolean
  action: 'show' | 'hide'
}

export interface FormSettings {
  showProgressBar: boolean
  submitButtonText: string
  thankYouMessage: string
  whatsappNumber: string
  whatsappMessage: string
  requiredQualifyingScore: number
}

export interface FormDefinition {
  id?: string
  name: string
  description?: string
  fields: FormField[]
  settings: FormSettings
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FormResponse {
  id: string
  formId: string
  submissionData: Record<string, any>
  isQualified: boolean
  qualifyingScore: number
  qualifyingTotal: number
  createdAt: string
}

export interface FormSchema {
  fields: FormField[]
  settings: FormSettings
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

export interface SubmissionPayload {
  formId: string
  submissionData: Record<string, any>
  isQualified: boolean
  qualifyingScore: number
  qualifyingTotal: number
}
