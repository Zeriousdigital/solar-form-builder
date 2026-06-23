import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

const DEFAULT_TOKEN = 'admin-token-123'

if (!localStorage.getItem('admin_token')) {
  localStorage.setItem('admin_token', DEFAULT_TOKEN)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized - admin token may be invalid')
    }
    return Promise.reject(error)
  }
)

export const formsApi = {
  getAll: () => api.get('/forms'),
  getById: (id: string) => api.get(`/forms/${id}`),
  create: (data: any) => api.post('/forms', data),
  update: (id: string, data: any) => api.put(`/forms/${id}`, data),
  delete: (id: string) => api.delete(`/forms/${id}`),
  publish: (id: string) => api.post(`/forms/${id}/publish`),
  draft: (id: string) => api.post(`/forms/${id}/draft`)
}

export const submissionsApi = {
  submit: (formId: string, data: any) => api.post('/submissions', { formId, ...data }),
  getByForm: (formId: string) => api.get(`/submissions/${formId}`)
}

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (settings: Record<string, string>) => api.put('/settings', { settings })
}

export default api
