import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Input, message, Spin, DatePicker, Checkbox, Select } from 'antd'
import api, { formsApi } from '../../services/api'
import { submissionsApi } from '../../services/api'
import { parseFormSchema, calculateQualifyingScore, getProgressPercent, buildWhatsAppMessage } from '../../utils/helpers'
import { fbq } from '../../services/meta'
import MetaPixel from '../common/MetaPixel'
import type { FormField } from '../../types'

const { TextArea } = Input

type Phase = 'qualifying' | 'non-qualifying' | 'contact-info' | 'submitted'

interface FormData {
  id: string
  name: string
  description?: string
  fields: FormField[]
  settings: {
    showProgressBar?: boolean
    submitButtonText?: string
    thankYouMessage?: string
    whatsappNumber: string
    whatsappMessage?: string
    requiredQualifyingScore?: number
    metaPixelId?: string
  }
}

const FormRenderer = () => {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [phase, setPhase] = useState<Phase>('qualifying')
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [transitioning, setTransitioning] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' })
  const [score, setScore] = useState<{ score: number; total: number }>({ score: 0, total: 0 })

  useEffect(() => {
    if (formId) fetchForm()
  }, [formId])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const res = await formsApi.getById(formId!)
      const formData = res.data.data
      const { fields, settings } = parseFormSchema(formData)
      setForm({
        ...formData,
        fields,
        settings
      })
    } catch (e) {
      message.error('Form not found')
    } finally {
      setLoading(false)
    }
  }

  const qualifyingFields = useMemo(() =>
    (form?.fields || []).filter(f => f.isQualifying || f.isDisqualifying),
    [form?.fields]
  )

  const nonQualifyingFields = useMemo(() =>
    (form?.fields || []).filter(f => !f.isQualifying && !f.isDisqualifying),
    [form?.fields]
  )

  const hasQualifyingFields = qualifyingFields.length > 0
  const isQualifyingPhase = phase === 'qualifying' && hasQualifyingFields
  const currentFields = isQualifyingPhase ? qualifyingFields : nonQualifyingFields
  const currentField = currentFields[currentStep] || null
  const totalSteps = currentFields.length
  const allFieldsCount = form?.fields.length || 0
  const answeredCount = currentFields.filter(f => answers[f.id] !== undefined).length

  const progress = useMemo(() => {
    if (!form?.fields.length) return 0
    const qualifyingDone = qualifyingFields.filter(f => answers[f.id] !== undefined).length
    if (phase === 'qualifying') return getProgressPercent(qualifyingDone, allFieldsCount)
    const nonQualifyingDone = nonQualifyingFields.filter(f => answers[f.id] !== undefined).length
    return getProgressPercent(qualifyingFields.length + nonQualifyingDone, allFieldsCount)
  }, [phase, answers, qualifyingFields, nonQualifyingFields, form?.fields.length])

  const handleAnswer = (value: any) => {
    if (!currentField) return
    setTransitioning(true)
    const newAnswers = { ...answers, [currentField.id]: value }
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1)
      } else if (isQualifyingPhase) {
        const result = calculateQualifyingScore(form?.fields || [], newAnswers)
        setScore(result)
        const hasDisqualifyingMarks = form?.fields?.some(f => f.disqualifyingAnswers?.length) ?? false
        if (hasDisqualifyingMarks) {
          if (result.bad > result.good) {
            fbq.trackCustom('DisqualifiedLead', { form_id: formId, good: result.good, bad: result.bad })
            api.post('/meta/event', {
              eventName: 'DisqualifiedLead',
              pixelId: form?.settings?.metaPixelId,
              accessToken: form?.settings?.metaAccessToken,
              userData: {},
              customData: { form_id: formId, good: result.good, bad: result.bad }
            }).then(r => console.log('[CAPI] DisqualifiedLead sent:', r.status))
              .catch(e => console.error('[CAPI] DisqualifiedLead error:', e.message))
            navigate(`/form/${formId}/thank-you?qualified=false`)
            return
          }
          if (nonQualifyingFields.length > 0) {
            setPhase('non-qualifying')
            setCurrentStep(0)
          } else {
            setPhase('contact-info')
          }
        } else {
          const required = form?.settings?.requiredQualifyingScore ?? result.total
          if (result.score >= required) {
            if (nonQualifyingFields.length > 0) {
              setPhase('non-qualifying')
              setCurrentStep(0)
            } else {
              setPhase('contact-info')
            }
          } else {
            fbq.trackCustom('DisqualifiedLead', { form_id: formId, score: result.score, total: result.total })
            api.post('/meta/event', {
              eventName: 'DisqualifiedLead',
              pixelId: form?.settings?.metaPixelId,
              accessToken: form?.settings?.metaAccessToken,
              userData: {},
              customData: { form_id: formId, score: result.score, total: result.total }
            }).then(r => console.log('[CAPI] DisqualifiedLead sent:', r.status))
              .catch(e => console.error('[CAPI] DisqualifiedLead error:', e.message))
            navigate(`/form/${formId}/thank-you?qualified=false`)
            return
          }
        }
      } else if (phase === 'non-qualifying') {
        setPhase('contact-info')
      }
      setTransitioning(false)
    }, 300)
  }

  const handleContactSubmit = async () => {
    if (!contactInfo.name.trim()) { message.warning('Please enter your name'); return }
    if (!contactInfo.email.trim()) { message.warning('Please enter your email'); return }
    if (!contactInfo.phone.trim()) { message.warning('Please enter your phone number'); return }
    setSubmitting(true)
    try {
      const allData = { ...answers, name: contactInfo.name, email: contactInfo.email, phone: contactInfo.phone }
      const result = calculateQualifyingScore(form?.fields || [], answers)
      await submissionsApi.submit(formId!, {
        submissionData: allData,
        isQualified: true,
        qualifyingScore: result.score,
        qualifyingTotal: result.total
      })
      sessionStorage.setItem('waNumber', form.settings?.whatsappNumber || '2348012345678')
      sessionStorage.setItem('waMessage', buildWhatsAppMessage(form.fields, answers, contactInfo))
      sessionStorage.setItem('pixelId', form.settings?.metaPixelId || '')
      sessionStorage.setItem('accessToken', form.settings?.metaAccessToken || '')
      navigate(`/form/${formId}/thank-you?qualified=true`)
    } catch (e) {
      message.error('Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (): React.ReactNode => {
    if (!currentField) return null
    switch (currentField.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {currentField.options?.map((opt: string) => (
              <Button
                key={opt}
                block
                className="answer-btn text-left h-auto py-3 px-4 whitespace-normal"
                size="large"
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <Checkbox.Group
            options={currentField.options || []}
            onChange={(values: any) => handleAnswer(values)}
          />
        )
      case 'dropdown':
        return (
          <Select
            className="w-full"
            placeholder={currentField.placeholder || 'Select an option'}
            size="large"
            onChange={(value) => handleAnswer(value)}
            options={(currentField.options || []).map((opt: string) => ({ label: opt, value: opt }))}
          />
        )
      case 'short_answer':
        return (
          <TextArea
            rows={3}
            placeholder={currentField.placeholder || 'Type your answer here...'}
            size="large"
            onPressEnter={(e: any) => handleAnswer(e.target.value)}
          />
        )
      case 'numeric':
        return (
          <Input
            type="number"
            placeholder={currentField.placeholder || 'Enter a number'}
            size="large"
            onPressEnter={(e: any) => handleAnswer(e.target.value)}
          />
        )
      case 'date':
        return (
          <DatePicker
            className="w-full"
            size="large"
            onChange={(_date, dateStr) => handleAnswer(dateStr)}
          />
        )
      case 'email':
        return (
          <Input
            type="email"
            placeholder={currentField.placeholder || 'Enter your email'}
            size="large"
            onPressEnter={(e: any) => handleAnswer(e.target.value)}
          />
        )
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={currentField.placeholder || 'Enter your phone number'}
            size="large"
            onPressEnter={(e: any) => handleAnswer(e.target.value)}
          />
        )
      default:
        return <p>Unsupported field type</p>
    }
  }

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />
  if (!form) return (
    <div className="form-container items-center justify-center text-center">
      <p className="text-red-500 text-lg">Form not found</p>
    </div>
  )

  const formPixelId = form.settings?.metaPixelId
  const formAccessToken = form.settings?.metaAccessToken

  return (
    <>
      <MetaPixel pixelId={formPixelId} accessToken={formAccessToken} />
      {(() => {
        if (phase === 'contact-info') {
    return (
      <div className="form-container">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: '100%' }} />
        </div>
        <div className="question-enter">
          <h3 className="text-xl font-semibold mb-1 text-green-700">You Qualify!</h3>
          <p className="text-gray-500 mb-6">
            Enter your details below and we'll connect you with a solar specialist.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input
                size="large"
                value={contactInfo.name}
                onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                size="large"
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input
                size="large"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+2348012345678"
              />
            </div>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleContactSubmit}
              loading={submitting}
              className="mt-4"
            >
              Submit & Chat on WhatsApp
            </Button>
          </div>
        </div>
      </div>
      )
    }

    return (
      <div className="form-container">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className={`question-enter ${transitioning ? 'opacity-0' : ''}`}>
          <div className="mb-1 text-xs text-gray-400">
            Question {answeredCount + 1} of {allFieldsCount}
          </div>

          <h3 className="text-xl font-semibold mb-4">{currentField?.label}</h3>
          {currentField?.required && (
            <p className="text-xs text-gray-400 mb-3">* Required</p>
          )}
          {renderField()}
        </div>
        {submitting && (
          <div className="flex justify-center mt-8">
            <Spin tip="Submitting..." />
          </div>
        )}
      </div>
    )
  })()}
    </>
  )
}

export default FormRenderer
