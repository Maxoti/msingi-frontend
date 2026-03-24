import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login, clearError } from './auth.slice'
import pensImage from '../../images/pens.jpg'
import logo from '../../images/logo.png'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((state) => state.auth)

  const [form, setForm] = useState({
    schoolName: '',
    username:   '',
    password:   '',
  })

  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (token) navigate('/')
  }, [token, navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) dispatch(clearError())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(login(form))
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Background Image + Overlay */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${pensImage})` }}
        />
        <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-[#0f172a]/60 border border-white/10 rounded-2xl p-8 text-white shadow-[0_0_40px_rgba(0,0,0,0.6)]">

          {/* Logo + Title */}
          <div className="text-center mb-6">
            <img
              src={logo}
              alt="Msingi Logo"
              className="w-16 h-16 object-contain mx-auto mb-3"
            />
            <h1 className="text-3xl font-bold">Msingi</h1>
            <p className="text-gray-400 text-sm">Smart School Management</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-lg px-4 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* School Name */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">School Name</label>
              <input
                type="text" name="schoolName" value={form.schoolName}
                onChange={handleChange} required placeholder="Enter school name"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Username</label>
              <input
                type="text" name="username" value={form.username}
                onChange={handleChange} required placeholder="Enter username"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange} required
                  placeholder="Enter password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Links */}
            <p className="text-center text-sm text-gray-400 mt-3">
              New school?{' '}
              <Link to="/onboard" className="text-blue-400 hover:underline">
                Register your school
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage