import axios from 'axios'

const api = axios.create({
  // TypeScript error fix: (import.meta as any).env use kiya hai
  baseURL: (import.meta as any).env.VITE_API_URL 
    ? `${(import.meta as any).env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && !window.location.pathname.includes('/onboarding')) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api