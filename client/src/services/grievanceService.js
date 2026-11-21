import api from './api';

// Fetch grievances with optional filtering
export const getGrievances = async (params = {}) => {
  const res = await api.get('/grievances', { params });
  return res.data;
};

// Get single grievance by id or trackingId
export const getGrievanceById = async (id) => {
  const res = await api.get(`/grievances/${id}`);
  return res.data;
};

// Submit new grievance (Multimodal Triage + Category 50m Deduplication)
export const createGrievance = async (formData) => {
  const res = await api.post('/grievances', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

// Verify repair resolution with Before/After Gemini Vision
export const resolveGrievance = async (id, formData) => {
  const res = await api.patch(`/grievances/${id}/resolve`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

// Reassign department / severity / status
export const reassignGrievance = async (id, updateData) => {
  const payload = typeof updateData === 'string' ? { assignedDepartment: updateData } : updateData;
  const res = await api.patch(`/grievances/${id}/reassign`, payload);
  return res.data;
};

// Upvote an existing open ticket
export const upvoteGrievance = async (id) => {
  const res = await api.post(`/grievances/${id}/upvote`);
  return res.data;
};

// Fetch KPI stats summary
export const getStatsSummary = async () => {
  const res = await api.get('/grievances/stats/summary');
  return res.data;
};

export const grievanceService = {
  getGrievances,
  getGrievanceById,
  createGrievance,
  resolveGrievance,
  reassignGrievance,
  upvoteGrievance,
  getStatsSummary
};

export default grievanceService;
