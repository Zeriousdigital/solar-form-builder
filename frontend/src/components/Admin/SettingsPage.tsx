import { useState, useEffect } from 'react'
import { Card, Input, Button, message, Spin } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { settingsApi } from '../../services/api'

const SettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testCode, setTestCode] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await settingsApi.getAll()
      const data = res.data.data || {}
      setPixelId(data.meta_pixel_id || '')
      setAccessToken(data.meta_access_token || '')
      setTestCode(data.meta_test_event_code || '')
    } catch (e) {
      message.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        meta_pixel_id: pixelId,
        meta_access_token: accessToken,
        meta_test_event_code: testCode
      })
      message.success('Meta settings saved')
    } catch (e) {
      message.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Meta Integration Settings</h2>
      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Pixel ID</label>
            <Input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder="1234567890"
            />
            <p className="text-xs text-gray-400 mt-1">
              Found in Meta Events Manager → Pixel → Settings
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Conversions API Access Token</label>
            <Input.Password
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="EAAB...927Z"
            />
            <p className="text-xs text-gray-400 mt-1">
              Generated in Meta Events Manager → Settings → Conversions API → Create Access Token
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Event Code (optional)</label>
            <Input
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="TEST12345"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used for testing in Meta Events Manager without recording real events
            </p>
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            Save Settings
          </Button>
        </div>
      </Card>
      <Card className="mt-4">
        <h3 className="text-sm font-medium mb-2">How it works</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
          <li><strong>Pixel (browser):</strong> Tracks page views and form events from the user's browser</li>
          <li><strong>CAPI (server):</strong> Sends lead events from your server as a backup, with hashed email/phone</li>
          <li><strong>QualifiedLead:</strong> Fired when a user passes your qualifying questions</li>
          <li><strong>DisqualifiedLead:</strong> Fired when a user fails the qualifying questions</li>
          <li><strong>Lead:</strong> Fired when a qualified user submits contact info</li>
        </ul>
      </Card>
    </div>
  )
}

export default SettingsPage
