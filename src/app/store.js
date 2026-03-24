import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authReducer from '../modules/auth/auth.slice'
import studentsReducer from '../modules/students/students.slice';
import staffReducer from '../modules/staff/staff.slice';
import classesReducer from '../modules/classes/classes.slice';
import subjectReducer from '../modules/subjects/subject.slice';
import attendanceReducer from '../modules/attendance/attendance.slice';
import examsReducer from '../modules/exams/exam.slice';
import feesReducer from '../modules/fees/fees.slice';
import academicTermsReducer from "../modules/academicTerms/academicTerms.slice";
import timetableReducer from '../modules/timetable/timetable.slice';
import aiReducer from '../modules/artificial_Intelligence/ai.slice';
const combinedReducer = combineReducers({
  auth:          authReducer,
  students:      studentsReducer,
  staff:         staffReducer,
  classes:       classesReducer,
  subjects:      subjectReducer,
  attendance:    attendanceReducer,
  exams:         examsReducer,
  fees:          feesReducer,
  academicTerms: academicTermsReducer,
  timetable:     timetableReducer,
  ai:            aiReducer,
});

// Wipes ALL Redux state when logout is dispatched
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export default store;