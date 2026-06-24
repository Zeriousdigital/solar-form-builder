import { useState, useEffect } from 'react'
import { Button, message, Input, Card, Tabs, Tag, Space, Modal, Spin, Switch, InputNumber, Checkbox, Badge } from 'antd'
import { SaveOutlined, SendOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { formsApi } from '../../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseFormSchema, hasCorrectAnswerSupport } from '../../utils/helpers'
import type { FormField } from '../../types'

const FIELD_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' }
]

const FIELD_DEFAULTS: Record<string, { options?: string[]; placeholder?: string }> = {
  multiple_choice: { options: ['Option 1', 'Option 2'], placeholder: 'Select one' },
  checkbox: { options: ['Option 1', 'Option 2'], placeholder: '' },
  dropdown: { options: ['Option 1', 'Option 2'], placeholder: 'Select...' },
  short_answer: { options: [], placeholder: 'Type your answer here...' },
  numeric: { options: [], placeholder: 'Enter a number' },
  date: { options: [], placeholder: 'Select a date' },
  email: { options: [], placeholder: 'Enter your email' },
  phone: { options: [], placeholder: 'Enter your phone number' }
}

const generateFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

const FormBuilderWrapper = () => {
  const [fields, setFields] = useState<FormField[]>([])
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [whatsapp, setWhatsapp] = useState<string>('234')
  const [metaPixelId, setMetaPixelId] = useState<string>('')
  const [metaAccessToken, setMetaAccessToken] = useState<string>('')
  const [requiredScore, setRequiredScore] = useState<number>(1)
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [formId, setFormId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setFormId(id)
      loadForm(id)
    }
  }, [searchParams])

  const loadForm = async (id: string) => {
    try {
      setLoading(true)
      const res = await formsApi.getById(id)
      const formData = res.data.data
      setName(formData.name || '')
      setDescription(formData.description || '')
      const { fields: savedFields, settings } = parseFormSchema(formData)
      setFields(savedFields || [])
      setWhatsapp(settings?.whatsappNumber || '234')
      setMetaPixelId(settings?.metaPixelId || '')
      setMetaAccessToken(settings?.metaAccessToken || '')
      setRequiredScore(settings?.requiredQualifyingScore ?? 1)
    } catch (e) {
      message.error('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const addField = (type: string) => {
    const defaults = FIELD_DEFAULTS[type] || { options: [], placeholder: '' }
    const newField: FormField = {
      id: generateFieldId(),
      type: type as FormField['type'],
      label: `New ${FIELD_TYPE_OPTIONS.find(o => o.value === type)?.label || type} Field`,
      required: false,
      options: defaults.options || [],
      placeholder: defaults.placeholder || '',
      isQualifying: false,
      correctAnswers: []
    }
    setFields([...fields, newField])
  }

  const removeField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const toggleQualifying = (fieldId: string) => {
    setFields(fields.map(f => {
      if (f.id !== fieldId) return f
      const isQualifying = !f.isQualifying
      return {
        ...f,
        isQualifying,
        correctAnswers: isQualifying && hasCorrectAnswerSupport(f.type) ? (f.correctAnswers || []) : []
      }
    }))
  }

  const openEditModal = (field: FormField) => {
    setEditingField({ ...field })
    setModalVisible(true)
  }

  const saveFieldEdit = () => {
    if (!editingField) return
    if (!editingField.label.trim()) {
      message.warning('Field label is required')
      return
    }
    setFields(fields.map(f => f.id === editingField.id ? editingField : f))
    setModalVisible(false)
    setEditingField(null)
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return
    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[newIndex]
    newFields[newIndex] = temp
    setFields(newFields)
  }

  const toggleCorrectAnswer = (option: string) => {
    if (!editingField) return
    const current = editingField.correctAnswers || []
    const isSelected = current.includes(option)
    if (editingField.type === 'multiple_choice' || editingField.type === 'dropdown') {
      setEditingField({
        ...editingField,
        correctAnswers: isSelected ? [] : [option]
      })
    } else {
      setEditingField({
        ...editingField,
        correctAnswers: isSelected
          ? current.filter(a => a !== option)
          : [...current, option]
      })
    }
  }

  const saveForm = async (publish: boolean) => {
    if (!name) {
      message.warning('Please enter a form name')
      return
    }
    if (fields.length === 0) {
      message.warning('Please add at least one field to the form')
      return
    }
    if (!whatsapp || whatsapp === '234') {
      message.warning('Please enter a valid WhatsApp number')
      return
    }
    const qualifyingFields = fields.filter(f => f.isQualifying)
    if (qualifyingFields.length > 0 && requiredScore < 1) {
      message.warning('Required correct answers must be at least 1')
      return
    }
    if (qualifyingFields.length > 0 && requiredScore > qualifyingFields.length) {
      message.warning('Required correct answers cannot exceed the number of qualifying questions')
      return
    }
    for (const f of qualifyingFields) {
      if (!f.correctAnswers || f.correctAnswers.length === 0) {
        message.warning(`"${f.label}" is marked as qualifying but has no correct answer set`)
        return
      }
    }
    setSaving(true)
    try {
      const formData = {
        name,
        description,
        fields,
        settings: {
          showProgressBar: true,
          submitButtonText: 'Submit',
          thankYouMessage: 'Thank you for your submission!',
          whatsappNumber: whatsapp,
          whatsappMessage: 'Hi, I just completed the solar assessment form',
          requiredQualifyingScore: requiredScore,
          metaPixelId: metaPixelId || undefined,
          metaAccessToken: metaAccessToken || undefined
        },
        isPublished: publish
      }
      if (formId) {
        await formsApi.update(formId, formData)
        message.success(publish ? 'Form published successfully!' : 'Form updated as draft')
      } else {
        await formsApi.create(formData)
        message.success(publish ? 'Form published successfully!' : 'Form saved as draft')
      }
      navigate('/admin/forms')
    } catch (error) {
      message.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const getFieldPreview = (field: FormField): string => {
    const typeLabel = FIELD_TYPE_OPTIONS.find(o => o.value === field.type)?.label || field.type
    return `${typeLabel}${field.required ? ' *' : ''}`
  }

  const qualifyingCount = fields.filter(f => f.isQualifying).length

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Form Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Solar Assessment Form"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number *</label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="2348012345678"
              addonBefore="+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Pixel ID (optional)</label>
            <Input
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="1234567890"
            />
            <span className="text-xs text-gray-400">Leave blank to use the global Pixel ID from Settings</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CAPI Access Token (optional)</label>
            <Input.Password
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder="EAAB...927Z"
            />
            <span className="text-xs text-gray-400">Required if using a different Pixel ID per form</span>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="builder"
          items={[
            {
              key: 'builder',
              label: 'Form Builder',
              children: (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {FIELD_TYPE_OPTIONS.map((ft) => (
                      <Button
                        key={ft.value}
                        icon={<PlusOutlined />}
                        onClick={() => addField(ft.value)}
                        size="small"
                      >
                        {ft.label}
                      </Button>
                    ))}
                  </div>

                  {fields.length === 0 && (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                      <p className="text-lg">No fields yet</p>
                      <p className="text-sm">Click a field type above to add your first question</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <Card
                        key={field.id}
                        size="small"
                        className={`border-l-4 ${field.isQualifying ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag color="blue">{getFieldPreview(field)}</Tag>
                              <span className="text-xs text-gray-400">#{index + 1}</span>
                              {field.isQualifying && (
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                  Qualifying
                                  {field.correctAnswers && field.correctAnswers.length > 0
                                    ? ` (${field.correctAnswers.length} correct)`
                                    : ' (no answer set)'}
                                </Tag>
                              )}
                            </div>
                            <span className="font-medium">{field.label}</span>
                            {field.options && field.options.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                Options: {field.options.join(', ')}
                              </div>
                            )}
                            {field.isQualifying && field.correctAnswers && field.correctAnswers.length > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                Correct: {field.correctAnswers.join(', ')}
                              </div>
                            )}
                          </div>
                          <Space direction="vertical" align="end" size="small">
                            <Space>
                              {index > 0 && (
                                <Button size="small" onClick={() => moveField(index, 'up')}>↑</Button>
                              )}
                              {index < fields.length - 1 && (
                                <Button size="small" onClick={() => moveField(index, 'down')}>↓</Button>
                              )}
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openEditModal(field)}
                              />
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeField(field.id)}
                              />
                            </Space>
                            {hasCorrectAnswerSupport(field.type) && (
                              <Space>
                                <span className="text-xs text-gray-500">Qualifying</span>
                                <Switch
                                  size="small"
                                  checked={field.isQualifying}
                                  onChange={() => toggleQualifying(field.id)}
                                  checkedChildren={<CheckCircleOutlined />}
                                />
                              </Space>
                            )}
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {qualifyingCount > 0 && (
                    <Card size="small" className="bg-yellow-50 border-yellow-200">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Required correct answers:</span>
                        <InputNumber
                          min={1}
                          max={qualifyingCount}
                          value={requiredScore}
                          onChange={(v) => setRequiredScore(v ?? 1)}
                        />
                        <span className="text-xs text-gray-500">
                          out of {qualifyingCount} qualifying question{qualifyingCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </Card>
                  )}
                </div>
              )
            },
            {
              key: 'preview',
              label: 'Preview',
              children: (
                <div className="p-4 bg-gray-50 rounded">
                  {fields.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Add fields to see a preview of your form
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-400 mb-2">
                        Questions will appear one at a time. Qualifying questions shown first.
                        {qualifyingCount > 0 && ` Need ${requiredScore}/${qualifyingCount} correct to pass.`}
                      </div>
                      {[...fields].sort((a, b) => {
                        if (a.isQualifying && !b.isQualifying) return -1
                        if (!a.isQualifying && b.isQualifying) return 1
                        return 0
                      }).map((field, index) => (
                        <div key={field.id} className={`p-3 bg-white rounded shadow-sm border-l-4 ${field.isQualifying ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                          <p className="text-sm font-medium mb-1">
                            {field.isQualifying && <Tag color="green">Qualifying</Tag>}
                            Q{index + 1}: {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {field.type === 'multiple_choice' && field.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <input type="radio" disabled />
                              <span className={`text-sm ${field.correctAnswers?.includes(opt) ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                {opt}{field.correctAnswers?.includes(opt) ? ' ✓' : ''}
                              </span>
                            </div>
                          ))}
                          {field.type === 'checkbox' && field.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <input type="checkbox" disabled />
                              <span className={`text-sm ${field.correctAnswers?.includes(opt) ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                {opt}{field.correctAnswers?.includes(opt) ? ' ✓' : ''}
                              </span>
                            </div>
                          ))}
                          {field.type === 'dropdown' && (
                            <div className="text-sm text-gray-400 py-1 border rounded px-2">
                              {field.placeholder || 'Select...'}
                            </div>
                          )}
                          {(field.type === 'short_answer' || field.type === 'email' || field.type === 'phone' || field.type === 'numeric') && (
                            <div className="text-sm text-gray-400 py-1 border-b">
                              {field.placeholder}{field.correctAnswers?.length ? ` (Answer: ${field.correctAnswers[0]})` : ''}
                            </div>
                          )}
                          {field.type === 'date' && (
                            <div className="text-sm text-gray-400 py-1 border rounded px-2">
                              {field.placeholder || 'Select a date'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          icon={<SaveOutlined />}
          onClick={() => saveForm(false)}
          loading={saving}
        >
          Save Draft
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => saveForm(true)}
          loading={saving}
        >
          Publish
        </Button>
      </div>

      <Modal
        title="Edit Field"
        open={modalVisible}
        onOk={saveFieldEdit}
        onCancel={() => { setModalVisible(false); setEditingField(null) }}
        okText="Save"
        width={520}
      >
        {editingField && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Field Label</label>
              <Input
                value={editingField.label}
                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                placeholder="Enter question text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Field Type</label>
              <Input value={FIELD_TYPE_OPTIONS.find(o => o.value === editingField.type)?.label || editingField.type} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Required <Switch size="small" checked={editingField.required} onChange={(v) => setEditingField({ ...editingField, required: v })} className="ml-2" />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Placeholder</label>
              <Input
                value={editingField.placeholder}
                onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                placeholder="Placeholder text"
              />
            </div>
            {(editingField.type === 'multiple_choice' || editingField.type === 'checkbox' || editingField.type === 'dropdown') && (
              <div>
                <label className="block text-sm font-medium mb-1">Options (one per line)</label>
                <Input.TextArea
                  rows={4}
                  value={editingField.options?.join('\n') || ''}
                  onChange={(e) => {
                    const opts = e.target.value.split('\n').map(o => o.trim()).filter(o => o)
                    setEditingField({
                      ...editingField,
                      options: opts,
                      correctAnswers: (editingField.correctAnswers || []).filter(a => opts.includes(a))
                    })
                  }}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}
            {(editingField.type === 'short_answer') && (
              <div>
                <label className="block text-sm font-medium mb-1">Expected correct answer (if qualifying)</label>
                <Input
                  value={editingField.correctAnswers?.[0] || ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    correctAnswers: e.target.value ? [e.target.value] : []
                  })}
                  placeholder="Exact text match"
                />
              </div>
            )}
            {(editingField.type === 'numeric') && (
              <div>
                <label className="block text-sm font-medium mb-1">Expected correct number (if qualifying)</label>
                <Input
                  value={editingField.correctAnswers?.[0] || ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    correctAnswers: e.target.value ? [e.target.value] : []
                  })}
                  placeholder="e.g. 42"
                />
              </div>
            )}
            {editingField.isQualifying && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <label className="block text-sm font-medium text-green-800 mb-2">
                  Mark correct answer{editingField.type === 'checkbox' ? 's' : ''}
                </label>
                {['multiple_choice', 'dropdown', 'checkbox'].includes(editingField.type) ? (
                  <div className="space-y-1">
                    {editingField.options?.map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox
                          checked={(editingField.correctAnswers || []).includes(opt)}
                          onChange={() => toggleCorrectAnswer(opt)}
                        >
                          <span className={`text-sm ${(editingField.correctAnswers || []).includes(opt) ? 'text-green-700 font-medium' : ''}`}>
                            {opt}
                          </span>
                        </Checkbox>
                      </div>
                    ))}
                    {(!editingField.options || editingField.options.length === 0) && (
                      <p className="text-xs text-red-500">Add options first to mark correct answers</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-700">
                    Correct answer set in the field above. Answer must match exactly.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FormBuilderWrapper
