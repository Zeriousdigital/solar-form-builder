import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message, Spin } from 'antd'
import { SaveOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { formsApi } from '../../services/api'

const FormEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [data, setData] = useState<any>({})

  useEffect(() => {
    if (id && id !== 'new') {
      fetchForm()
    }
  }, [id])

  const fetchForm = async () => {
    try {
      setLoading(true)
      const res = await formsApi.getById(id!)
      const formData = res.data.data
      const schema = typeof formData.schema === 'string'
        ? JSON.parse(formData.schema)
        : formData.schema || {}
      setData({
        ...formData,
        fields: schema.fields || [],
        settings: schema.settings || formData.settings || {}
      })
    } catch (e) {
      message.error('Failed to load form')
      navigate('/admin/forms')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        name: data.name,
        description: data.description,
        fields: data.fields || [],
        settings: data.settings || {},
        isPublished: data.isPublished || false
      }
      if (id && id !== 'new') {
        await formsApi.update(id, payload)
        message.success('Form updated')
      } else {
        await formsApi.create(payload)
        message.success('Form created')
      }
      navigate('/admin/forms')
    } catch (e) {
      message.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      await formsApi.publish(id!)
      message.success('Form published')
      navigate('/admin/forms')
    } catch (e) {
      message.error('Failed to publish')
    }
  }

  if (loading) {
    return <Spin size="large" className="flex justify-center mt-20" />
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/forms')}
        className="mb-4"
      >
        Back
      </Button>
      <Card>
        <Form layout="vertical">
          <Form.Item label="Form Name">
            <Input
              placeholder="Solar Assessment Form"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Brief description"
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="WhatsApp Number">
            <Input
              placeholder="2348012345678"
              addonBefore="+"
              value={data.settings?.whatsappNumber}
              onChange={(e) =>
                setData({
                  ...data,
                  settings: {
                    ...(data.settings || {}),
                    whatsappNumber: e.target.value
                  }
                })
              }
            />
          </Form.Item>
        </Form>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            {id && id !== 'new' ? 'Update' : 'Create'}
          </Button>
          {id && id !== 'new' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublish}
            >
              Publish
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default FormEditor
