import api from "./axiosConfig";

export const getTasks = () => api.get("/api/tasks/assign-tasks");
export const createTask = (payload) => api.post("/api/tasks/assign-tasks", payload);
export const updateTask = (taskId, payload) => api.patch(`/api/tasks/${taskId}`, payload);
export const deleteTask = (taskId) => api.delete(`/api/tasks/${taskId}`);
export const getTaskTracking = () => api.get("/api/tasks/task-tracking");
export const getTaskReports = () => api.get("/api/tasks/task-reports");
