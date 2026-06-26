import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import AdminLayout from './components/Admin/AdminLayout'
import FormList from './components/Admin/FormList'
import FormEditor from './components/Admin/FormEditor'
import FormBuilderWrapper from './components/Admin/FormBuilderWrapper'
import FormResponses from './components/Admin/FormResponses'
import SettingsPage from './components/Admin/SettingsPage'
import FormRenderer from './components/Public/FormRenderer'
import ThankYouPage from './components/Public/ThankYouPage'
import './index.css'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<FormList />} />
            <Route path="forms" element={<FormList />} />
            <Route path="forms/new" element={<FormEditor />} />
            <Route path="forms/:id/edit" element={<FormEditor />} />
            <Route path="forms/:id/responses" element={<FormResponses />} />
            <Route path="builder" element={<FormBuilderWrapper />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/form/:formId" element={<FormRenderer />} />
          <Route path="/form/:formId/thank-you" element={<ThankYouPage />} />
          <Route path="/" element={<FormRenderer />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
