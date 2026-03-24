import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Auto-refresh on 401 instead of immediate logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Use plain axios — not api — to avoid infinite retry loop
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken })
        const { token, refreshToken: newRefresh } = res.data.data

        localStorage.setItem('token', token)
        if (newRefresh) localStorage.setItem('refreshToken', newRefresh)

        // Retry the original failed request with the new token
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        // Refresh also failed — force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api