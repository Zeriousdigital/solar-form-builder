import { useParams, useSearchParams } from 'react-router-dom'
import { Button, Result } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { fbq } from '../../services/meta'
import MetaPixel from '../common/MetaPixel'

const ThankYouPage = () => {
  const { formId } = useParams()
  const [searchParams] = useSearchParams()
  const qualified = searchParams.get('qualified') === 'true'
  const pixelId = sessionStorage.getItem('pixelId') || undefined
  const accessToken = sessionStorage.getItem('accessToken') || undefined

  useEffect(() => {
    setTimeout(() => {
      sessionStorage.removeItem('waNumber')
      sessionStorage.removeItem('waMessage')
      sessionStorage.removeItem('pixelId')
      sessionStorage.removeItem('accessToken')
    }, 60000)
  }, [])

  useEffect(() => {
    if (!qualified) {
      fbq.trackCustom('DisqualifiedLead', { form_id: formId })
    } else {
      fbq.trackCustom('CompleteRegistration', { form_id: formId })
    }
  }, [])

  if (qualified) {
    const waNumber = sessionStorage.getItem('waNumber') || '2348012345678'
    const waMessage = encodeURIComponent(sessionStorage.getItem('waMessage') || 'Thank you!')
    return (
      <>
        <MetaPixel pixelId={pixelId} accessToken={accessToken} />
        <div className="form-container items-center justify-center text-center">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2 text-green-700">Thank You!</h3>
            <p className="text-gray-500 mb-6">
              Your information has been submitted. Click below to chat with us on WhatsApp.
            </p>
            <a href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${waMessage}`}
               target="_blank" rel="noopener noreferrer">
              <Button className="whatsapp-button" type="primary" size="large" block>
                Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <MetaPixel pixelId={pixelId} accessToken={accessToken} />
      <div className="form-container items-center justify-center text-center">
        <Result
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 64 }} />}
          title="Not the Right Fit"
          subTitle="You're not a right fit for our solar solutions at this time, but thank you for your time and interest."
        />
      </div>
    </>
  )
}

export default ThankYouPage
