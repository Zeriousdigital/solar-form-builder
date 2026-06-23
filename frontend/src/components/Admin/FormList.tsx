import { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, ToolOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { formsApi } from '../../services/api'

interface FormRecord {
  id: string
  name: string
  description: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

const FormList = () => {
  const [forms, setForms] = useState<FormRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const fetchForms = async () => {
    try {
      setLoading(true)
      const res = await formsApi.getAll()
      setForms(res.data.data || [])
    } catch (e) {
      message.error('Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await formsApi.delete(id)
      message.success('Form deleted')
      fetchForms()
    } catch (e) {
      message.error('Failed to delete form')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await formsApi.publish(id)
      message.success('Form published')
      fetchForms()
    } catch (e) {
      message.error('Failed to publish form')
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, r: FormRecord) => (
        <a onClick={() => navigate(`/admin/forms/${r.id}/edit`)}>{name}</a>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-'
    },
    {
      title: 'Status',
      dataIndex: 'isPublished',
      key: 'status',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'orange'}>{v ? 'Published' : 'Draft'}</Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, r: FormRecord) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => window.open(`/form/${r.id}`, '_blank')}
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/admin/forms/${r.id}/edit`)}
          />
          <Button
            icon={<ToolOutlined />}
            size="small"
            onClick={() => navigate(`/admin/builder?id=${r.id}`)}
          >
            Builder
          </Button>
          <Button
            icon={<FileTextOutlined />}
            size="small"
            onClick={() => navigate(`/admin/forms/${r.id}/responses`)}
          />
          {!r.isPublished && (
            <Button
              type="primary"
              size="small"
              onClick={() => handlePublish(r.id)}
            >
              Publish
            </Button>
          )}
          <Popconfirm
            title="Delete this form?"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">All Forms</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/forms/new')}
        >
          Create Form
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={forms}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default FormList
