import api from '../../config/api';

export const getSlots         = ()              => api.get('/timetable/slots');
export const createSlot       = (data)          => api.post('/timetable/slots', data);
export const updateSlot       = (id, data)      => api.put(`/timetable/slots/${id}`, data);
export const deleteSlot       = (id)            => api.delete(`/timetable/slots/${id}`);

export const createEntry      = (data)          => api.post('/timetable', data);
export const getClassTimetable   = (classId, termId)  => api.get(`/timetable/class/${classId}?termId=${termId}`);
export const getTeacherTimetable = (staffId, termId)  => api.get(`/timetable/teacher/${staffId}?termId=${termId}`);
export const updateEntry      = (id, data)      => api.put(`/timetable/${id}`, data);
export const deleteEntry      = (id)            => api.delete(`/timetable/${id}`);
