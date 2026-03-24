import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../modules/auth/auth.slice'

const navItems = [
  { path: '/',            label: 'Dashboard'   },
  { path: '/students',    label: 'Students'    },
  { path: '/staff',       label: 'Staff'       },
  { path: '/timetable',   label: 'Timetable'   },
  { path: '/classes',     label: 'Classes'     },
  { path: '/subjects',    label: 'Subjects'    },
  { path: '/attendance',  label: 'Attendance'  },
  { path: '/exams',       label: 'Exams'       },
  { path: '/fees',        label: 'Fees'        },
  { path: '/terms',       label: 'Terms'       },
]

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    window.location.href = '/login'
  }

  return (
    <>
      {isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden'
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className='flex items-center justify-between px-6 py-5 border-b border-gray-700'>
          <div>
            <h1 className='text-xl font-bold text-white'>{user?.schoolName || 'School'}</h1>
            <p className='text-xs text-gray-400'>School Management</p>
          </div>
          <button onClick={onClose} className='lg:hidden text-gray-400 hover:text-white'>
            ✕
          </button>
        </div>

        <div className='px-6 py-4 border-b border-gray-700'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold'>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className='text-sm font-medium text-white'>{user?.username}</p>
              <p className='text-xs text-gray-400'>{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className='flex-1 px-4 py-4 space-y-1 overflow-y-auto'>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors duration-150
                  ${isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className='px-4 py-4 border-t border-gray-700'>
          <button
            onClick={handleLogout}
            className='flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-red-600 hover:text-white w-full transition-colors duration-150'
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
