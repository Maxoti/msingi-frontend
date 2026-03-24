import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import pensImage from '../../images/student.jpg';
import logo from '../../images/logo.png';

export default function SchoolOnboarding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    schoolName: '', schoolEmail: '', schoolPhone: '', county: '',
    adminUsername: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  });
  const [error, setError]                           = useState('');
  const [loading, setLoading]                       = useState(false);
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.adminPassword !== form.confirmPassword)
      return setError('Passwords do not match');
    setLoading(true);
    try {
      await axios.post('/api/v1/schools/onboard', form);
      navigate('/login?registered=true');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

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

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg px-6 py-10">
        <div className="backdrop-blur-xl bg-[#0f172a]/60 border border-white/10 rounded-2xl p-8 text-white shadow-[0_0_40px_rgba(0,0,0,0.6)]">

          {/* Logo + Title */}
          <div className="text-center mb-6">
            <img
              src={logo}
              alt="Msingi Logo"
              className="w-16 h-16 object-contain mx-auto mb-3"
            />
            <h1 className="text-3xl font-bold">Msingi</h1>
            <p className="text-gray-400 text-sm">Set up your school and admin account in one step</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-400 text-red-200 rounded-lg px-4 py-2 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* School Details */}
            <p className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-1">
              School Details
            </p>

            <div>
              <label className="block text-sm text-gray-300 mb-1">School Name *</label>
              <input name="schoolName" required onChange={handleChange}
                placeholder="Enter school name" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">School Email</label>
              <input name="schoolEmail" type="email" onChange={handleChange}
                placeholder="Enter school email" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Phone Number</label>
              <input name="schoolPhone" onChange={handleChange}
                placeholder="Enter phone number" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">County</label>
              <input name="county" onChange={handleChange}
                placeholder="Enter county" className={inputClass} />
            </div>

            {/* Admin Account */}
            <p className="text-sm font-semibold text-gray-300 border-b border-white/10 pb-1 pt-2">
              Admin Account
            </p>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Admin Username *</label>
              <input name="adminUsername" required onChange={handleChange}
                placeholder="Enter username" className={inputClass} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Admin Email *</label>
              <input name="adminEmail" type="email" required onChange={handleChange}
                placeholder="Enter admin email" className={inputClass} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Password *</label>
              <div className="relative">
                <input name="adminPassword" required onChange={handleChange}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <input name="confirmPassword" required onChange={handleChange}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className={`${inputClass} pr-10`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Setting up...' : 'Register School & Admin'}
            </button>

            <p className="text-center text-sm text-gray-400 mt-3">
              Already registered?{' '}
              <a href="/login" className="text-blue-400 hover:underline">Sign in</a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}