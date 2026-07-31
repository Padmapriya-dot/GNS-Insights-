import api from "./axiosConfig";

export const getTasks = () => api.get("/tasks/assign-tasks");

export const createTask = (payload) => api.post("/tasks/assign-tasks", payload);

export const updateTask = (taskId, payload) =>
  api.patch(`/tasks/${taskId}`, payload);

export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);

export const getTaskTracking = () => api.get("/tasks/task-tracking");

export const getTaskReports = () => api.get("/tasks/task-reports");
