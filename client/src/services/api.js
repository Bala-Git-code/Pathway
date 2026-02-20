import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

export const pathwayApi = {
  create: (payload) => api.post("/pathways", payload),
  getAll: () => api.get("/pathways"),
  getLatest: () => api.get("/pathways/latest"),
  getById: (id) => api.get(`/pathways/${id}`),
  update: (id, payload) => api.put(`/pathways/${id}`, payload),
  remove: (id) => api.delete(`/pathways/${id}`),
  perturb: (id, payload) => api.post(`/pathways/${id}/perturb`, payload),
};

export const aiApi = {
  analyze: (payload) => api.post("/ai/analyze", payload),
};

export default api;
