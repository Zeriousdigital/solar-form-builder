import { Button, Input, Checkbox, Select, DatePicker } from 'antd'

const { TextArea } = Input

interface FormField {
  id: string
  type: string
  label: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface QuestionPageProps {
  field: FormField
  onAnswer: (value: any) => void
  currentStep: number
  totalSteps: number
}

const QuestionPage = ({ field, onAnswer, currentStep, totalSteps }: QuestionPageProps) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  const renderInput = () => {
    switch (field.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {field.options?.map((opt: string) => (
              <Button
                key={opt}
                block
                className="text-left h-auto py-3 px-4 whitespace-normal"
                size="large"
                onClick={() => onAnswer(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <Checkbox.Group
            options={field.options || []}
            onChange={(values: any) => onAnswer(values)}
          />
        )
      case 'dropdown':
        return (
          <Select
            className="w-full"
            placeholder={field.placeholder || 'Select'}
            size="large"
            onChange={(value) => onAnswer(value)}
            options={(field.options || []).map((opt: string) => ({
              label: opt,
              value: opt
            }))}
          />
        )
      case 'short_answer':
        return (
          <TextArea
            rows={3}
            placeholder={field.placeholder || 'Type your answer...'}
            size="large"
            onPressEnter={(e: any) => onAnswer(e.target.value)}
          />
        )
      case 'numeric':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || 'Enter a number'}
            size="large"
            onPressEnter={(e: any) => onAnswer(Number(e.target.value))}
          />
        )
      case 'date':
        return (
          <DatePicker
            className="w-full"
            size="large"
            onChange={(_date, dateStr) => onAnswer(dateStr)}
          />
        )
      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder || 'Enter your email'}
            size="large"
            onPressEnter={(e: any) => onAnswer(e.target.value)}
          />
        )
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || 'Enter your phone number'}
            size="large"
            onPressEnter={(e: any) => onAnswer(e.target.value)}
          />
        )
      default:
        return <p className="text-gray-500">Unsupported field type</p>
    }
  }

  return (
    <div>
      <div className="progress-bar mb-6">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="question-enter">
        <div className="mb-1 text-xs text-gray-400">
          Question {currentStep + 1} of {totalSteps}
        </div>
        <h3 className="text-xl font-semibold mb-1">{field.label}</h3>
        {field.required && (
          <p className="text-xs text-gray-400 mb-4">* Required</p>
        )}
        <div className="mt-4">{renderInput()}</div>
      </div>
    </div>
  )
}

export default QuestionPage
