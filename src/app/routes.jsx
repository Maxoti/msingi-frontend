import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoginPage from '../modules/auth/LoginPage'
import RegisterPage from '../modules/auth/RegisterPage'
import AdminLayout from '../layouts/AdminLayout'
import DashboardPage from '../modules/dashboard/DashboardPage'
import StudentsPage from '../modules/students/StudentsPage'
import StaffPage from '../modules/staff/StaffPage'
 import ClassesPage from '../modules/classes/classesPage'
 import SubjectsPage from '../modules/subjects/subjectPage'
import AttendancePage from '../modules/attendance/attendancePage'
import ExamsPage from '../modules/exams/examPage'
import FeesPage from '../modules/fees/feesPage'
import Academictermspage from '../modules/academicTerms/Academictermspage'
import SchoolOnboarding from '../modules/school/SchoolOnboarding';
import TimetablePage from '../modules/timetable/TimetablePage'



const PrivateRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth)
  return token ? children : <Navigate to='/login' replace />
}

const Soon = ({ label }) => (
  <div style={{ padding: 32, color: '#aaa', fontSize: 15 }}>
    {label} — coming soon
  </div>
)

const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/login'    element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
              <Route path="/onboard" element={<SchoolOnboarding />} />


      <Route
        path='/'
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index                element={<DashboardPage />} />
        <Route path='students'      element={<StudentsPage />} />   
        <Route path='staff'         element={<StaffPage />} /> 
        <Route path='classes'       element={<ClassesPage />} />
        <Route path='subjects'      element={<SubjectsPage />} />
        <Route path='attendance'    element={<AttendancePage />} />
        <Route path='exams'         element={<ExamsPage />} />
        <Route path='fees'          element={<FeesPage />} />
        <Route path='terms'         element={<Academictermspage />} />
        <Route path='timetable'     element={<TimetablePage />} />
      </Route>

      <Route path='*' element={<Navigate to='/onboard' replace />} />
    </Routes>
  )
}

export default AppRoutes