import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table, Card, Button, Tag, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { submissionsApi } from '../../services/api'

interface SubmissionRecord {
  id: string
  formId: string
  submissionData: Record<string, any>
  isQualified: boolean
  createdAt: string
}

const FormResponses = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [responses, setResponses] = useState<SubmissionRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (id) {
      fetchResponses()
    }
  }, [id])

  const fetchResponses = async () => {
    try {
      setLoading(true)
      const res = await submissionsApi.getByForm(id!)
      setResponses(res.data.data || [])
    } catch (e) {
      message.error('Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleString()
    },
    {
      title: 'Qualified',
      dataIndex: 'isQualified',
      key: 'isQualified',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Tag>
      )
    },
    {
      title: 'Data',
      dataIndex: 'submissionData',
      key: 'submissionData',
      render: (d: Record<string, any>) => (
        <pre className="text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
          {JSON.stringify(d, null, 2)}
        </pre>
      )
    }
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/forms')}
        className="mb-4"
      >
        Back to Forms
      </Button>
      <Card>
        <Table
          columns={columns}
          dataSource={responses}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default FormResponses
