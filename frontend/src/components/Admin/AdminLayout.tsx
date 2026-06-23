import { Outlet, Link, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu } from 'antd'
import { AppstoreOutlined, FormOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons'

const { Header, Content, Sider } = AntLayout

const AdminLayout = () => {
  const location = useLocation()

  const items = [
    {
      key: '/admin/forms',
      icon: <AppstoreOutlined />,
      label: <Link to="/admin/forms">All Forms</Link>
    },
    {
      key: '/admin/forms/new',
      icon: <FormOutlined />,
      label: <Link to="/admin/forms/new">Create New</Link>
    },
    {
      key: '/admin/builder',
      icon: <FileTextOutlined />,
      label: <Link to="/admin/builder">Builder</Link>
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Settings</Link>
    }
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="light">
        <div className="p-4 font-bold text-lg border-b">Solar Form Builder</div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          className="mt-2"
        />
      </Sider>
      <AntLayout>
        <Header className="bg-white shadow-sm flex justify-between items-center px-4">
          <h2 className="text-lg font-medium">Admin Dashboard</h2>
        </Header>
        <Content className="m-4 p-4 bg-white rounded-lg">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default AdminLayout
