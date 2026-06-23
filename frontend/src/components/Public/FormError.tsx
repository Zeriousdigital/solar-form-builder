import { Button, Result } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface FormErrorProps {
  message?: string
  onRetry?: () => void
}

const FormError = ({ message, onRetry }: FormErrorProps) => (
  <div className="form-container items-center justify-center text-center">
    <Result
      status="error"
      title="Something went wrong"
      subTitle={message || 'Unable to load the form. Please try again.'}
      extra={
        onRetry && (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            size="large"
          >
            Try Again
          </Button>
        )
      }
    />
  </div>
)

export default FormError
