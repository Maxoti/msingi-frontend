import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../config/api'

const StatCard = ({ label, value, icon, gradient, to }) => {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => to && navigate(to)}
      className={`rounded-2xl p-6 ${gradient} ${to ? 'cursor-pointer' : ''} shadow-sm hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white">
        {value ?? <span className="opacity-40 animate-pulse">—</span>}
      </p>
    </div>
  )
}

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth)
  const [stats, setStats] = useState({
    students: null,
    staff: null,
    classes: null,
    feeCollection: null,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const [studentsRes, staffRes, classesRes, feesRes] = await Promise.allSettled([
        api.get('/students?limit=1&page=1'),
        api.get('/staff?limit=100&page=1'),
        api.get('/classes?limit=100&page=1'),
        api.get('/fees/reports/summary'),
      ])

      setStats({
        students:
          studentsRes.status === 'fulfilled'
            ? studentsRes.value.data?.pagination?.total ??
              studentsRes.value.data?.data?.total ??
              studentsRes.value.data?.total ??
              studentsRes.value.data?.data?.data?.length ??
              studentsRes.value.data?.data?.length ?? '—'
            : '—',
        staff:
          staffRes.status === 'fulfilled'
            ? staffRes.value.data?.pagination?.total ??
              staffRes.value.data?.data?.total ??
              staffRes.value.data?.total ??
              staffRes.value.data?.data?.data?.length ??
              staffRes.value.data?.data?.length ?? '—'
            : '—',
        classes:
          classesRes.status === 'fulfilled'
            ? classesRes.value.data?.pagination?.total ??
              classesRes.value.data?.data?.total ??
              classesRes.value.data?.total ??
              classesRes.value.data?.data?.data?.length ??
              classesRes.value.data?.data?.length ?? '—'
            : '—',
        feeCollection:
          feesRes.status === 'fulfilled'
            ? (() => {
                const d = feesRes.value.data?.data || feesRes.value.data
                const amount = d?.total_collected ?? d?.totalCollected ?? d?.collected ?? null
                return amount !== null ? `KES ${Number(amount).toLocaleString('en-KE')}` : '—'
              })()
            : '—',
      })
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Total Students',
      value: stats.students,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      to: '/students',
    },
    {
      label: 'Total Staff',
      value: stats.staff,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      to: '/staff',
    },
    {
      label: 'Classes',
      value: stats.classes,
      gradient: 'bg-gradient-to-br from-orange-400 to-rose-500',
      to: '/classes',
    },
    {
      label: 'Fee Collection',
      value: stats.feeCollection,
      gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
      to: '/fees',
    },
  ]

  const actions = [
    { label: 'Add Student',     path: '/students', desc: 'Enroll a new student',      hoverClass: 'hover:border-blue-400 hover:bg-blue-50 group-hover:text-blue-600' },
    { label: 'Mark Attendance', path: '/attendance',   desc: "Record today's attendance", hoverClass: 'hover:border-emerald-400 hover:bg-emerald-50 group-hover:text-emerald-600' },
    { label: 'Record Payment',  path: '/fees',          desc: 'Log a fee payment',         hoverClass: 'hover:border-amber-400 hover:bg-amber-50 group-hover:text-amber-600' },
    { label: 'Create Exam',     path: '/exams',     desc: 'Set up a new exam',         hoverClass: 'hover:border-rose-400 hover:bg-rose-50 group-hover:text-rose-600' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.username || user?.name || 'Admin'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Here is what is happening in your school today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className={`group flex flex-col items-center justify-center p-5 rounded-xl border border-gray-200 transition-all text-center gap-2 ${action.hoverClass}`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                {action.label}
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {action.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage