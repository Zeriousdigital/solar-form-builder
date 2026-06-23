import axios from 'axios'
import { hashEmail, hashPhone } from '../utils/crypto'
import { getSettings } from './settingsService'

const CAPI_URL = 'https://graph.facebook.com/v20.0'

export interface CAPIOptions {
  eventName: string
  userData: {
    email?: string
    phone?: string
  }
  customData?: Record<string, any>
  eventSourceUrl?: string
  pixelId?: string
}

export const sendToCAPI = async (options: CAPIOptions): Promise<any> => {
  const { eventName, userData, customData, eventSourceUrl, pixelId: formPixelId } = options

  const settings = await getSettings()
  const pixelId = formPixelId || settings.meta_pixel_id || process.env.META_PIXEL_ID || ''
  const accessToken = settings.meta_access_token || process.env.META_ACCESS_TOKEN || ''
  const testEventCode = settings.meta_test_event_code || process.env.META_TEST_EVENT_CODE || ''

  if (!pixelId || !accessToken) {
    console.warn('Meta Pixel ID or Access Token not configured, skipping CAPI event')
    return null
  }

  const userDataPayload: Record<string, string[]> = {}
  if (userData.email) {
    userDataPayload.em = [hashEmail(userData.email)]
  }
  if (userData.phone) {
    userDataPayload.ph = [hashPhone(userData.phone)]
  }

  const event = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl || '',
    user_data: {
      ...userDataPayload,
      client_ip_address: '',
      client_user_agent: ''
    },
    custom_data: customData || {}
  }

  const payload: Record<string, any> = {
    data: [event],
    access_token: accessToken
  }

  if (testEventCode) {
    payload.test_event_code = testEventCode
  }

  try {
    const response = await axios.post(`${CAPI_URL}/${pixelId}/events`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    })
    console.log('CAPI event sent successfully:', eventName)
    return response.data
  } catch (error: any) {
    const errorMessage = error?.response?.data?.error?.message || error.message
    const errorCode = error?.response?.data?.error?.code || 'UNKNOWN'
    console.error(`CAPI Error [${errorCode}]:`, errorMessage)
    throw new Error(`Meta CAPI failed: ${errorMessage}`)
  }
}
