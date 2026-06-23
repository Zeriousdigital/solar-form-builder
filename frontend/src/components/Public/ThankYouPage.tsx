import { useParams, useSearchParams } from 'react-router-dom'
import { Button, Result } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { fbq } from '../../services/meta'

const ThankYouPage = () => {
  const { formId } = useParams()
  const [searchParams] = useSearchParams()
  const qualified = searchParams.get('qualified') === 'true'

  useEffect(() => {
    if (!qualified) {
      fbq.trackCustom('DisqualifiedLead', { form_id: formId })
    }
  }, [])

  if (qualified) {
    return (
      <div className="form-container items-center justify-center text-center">
        <Result
          status="success"
          title="You Qualify!"
          subTitle="Please go back and complete your contact information to connect with a solar specialist."
        />
      </div>
    )
  }

  return (
    <div className="form-container items-center justify-center text-center">
      <Result
        icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 64 }} />}
        title="You Do Not Qualify"
        subTitle="Based on your responses, our solar solutions are not a fit at this time. Thank you for your interest."
      />
    </div>
  )
}

export default ThankYouPage
