import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://cvsmuhhazj.us-east-1.awsapprunner.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minute timeout for PDF generation
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(
      `Response received from ${response.config.url}:`,
      response.status
    );
    return response;
  },
  (error) => {
    console.error("Response error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export interface RFP {
  _id: string;
  title: string;
  clientName: string;
  submissionDeadline?: string;
  budgetRange?: string;
  projectType: string;
  keyRequirements: string[];
  evaluationCriteria: any[];
  deliverables: string[];
  timeline?: string;
  specialRequirements: string[];
  createdAt: string;
}

export interface Proposal {
  _id: string;
  rfpId: string;
  templateId: string;
  title: string;
  status: string;
  sections: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  projectType: string;
  sectionCount: number;
}

// RFP API calls
export const rfpApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/rfp/upload", formData);
  },
  analyzeUrl: (url: string) => {
    return api.post("/api/rfp/analyze-url", { url });
  },
  list: () => api.get<{ data: RFP[] }>("/api/rfp"),
  get: (id: string) => api.get<RFP>(`/api/rfp/${id}`),
  update: (id: string, data: any) => api.put<RFP>(`/api/rfp/${id}`, data),
  delete: (id: string) => api.delete(`/api/rfp/${id}`),
  getSectionTitles: (id: string) =>
    api.post<{ titles: string[] }>(`/api/rfp/${id}/ai-section-titles`),
};

// Proposal API calls
export const proposalApi = {
  generate: (data: {
    rfpId: string;
    templateId: string;
    title: string;
    customContent?: any;
  }) => api.post<Proposal>("/api/proposals/generate", data),
  list: () => api.get<{ data: Proposal[] }>("/api/proposals"),
  get: (id: string) => api.get<Proposal>(`/api/proposals/${id}`),
  update: (id: string, data: any) =>
    api.put<Proposal>(`/api/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/api/proposals/${id}`),
  exportPdf: (id: string) =>
    api.get(`/api/proposals/${id}/export/pdf`, { responseType: "blob" }),
  exportDocx: (id: string) =>
    api.get(`/api/proposals/${id}/export-docx`, { responseType: "blob" }),
};

// Template API calls
export const templateApi = {
  list: () => api.get<{ data: Template[] }>("/api/templates"),
  get: (id: string) => api.get(`/api/templates/${id}`),
  create: (data: any) => api.post("/api/templates", data),
  update: (id: string, data: any) => api.put(`/api/templates/${id}`, data),
  delete: (id: string) => api.delete(`/api/templates/${id}`),
  preview: (id: string, rfpData?: any) =>
    api.get(`/api/templates/${id}/preview`, { params: rfpData }),
};

// Content API calls
export const contentApi = {
  getCompany: () => api.get("/api/content/company"),
  updateCompany: (data: any) => api.put("/api/content/company", data),
  getTeam: () => api.get("/api/content/team"),
  getTeamMember: (id: string) => api.get(`/api/content/team/${id}`),
  createTeamMember: (data: any) => api.post("/api/content/team", data),
  updateTeamMember: (memberId: string, data: any) =>
    api.put(`/api/content/team/${memberId}`, data),
  deleteTeamMember: (memberId: string) =>
    api.delete(`/api/content/team/${memberId}`),
  getProjects: () => api.get("/api/content/projects"),
  createProject: (data: any) => api.post("/api/content/projects", data),
  updateProject: (id: string, data: any) =>
    api.put(`/api/content/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/content/projects/${id}`),
  getReferences: (projectType?: string) =>
    api.get("/api/content/references", {
      params: { project_type: projectType },
    }),
  createReference: (data: any) => api.post("/api/content/references", data),
  updateReference: (id: string, data: any) =>
    api.put(`/api/content/references/${id}`, data),
  deleteReference: (id: string) => api.delete(`/api/content/references/${id}`),
};

// AI API calls
export const aiApi = {
  editText: (data: { text?: string; selectedText?: string; prompt: string }) =>
    api.post("/api/ai/edit-text", data),
  generateContent: (data: {
    prompt: string;
    context?: string;
    contentType?: string;
  }) => api.post("/api/ai/generate-content", data),
};
export const proposalApiPdf = {
  generate: (data: {
    rfpId: string;
    templateId: string;
    title: string;
    customContent?: any;
  }) => api.post<Proposal>("/api/proposals/generate", data),
  list: () => api.get<{ data: Proposal[] }>("/api/proposals"),
  get: (id: string) => api.get<Proposal>(`/api/proposals/${id}`),
  update: (id: string, data: any) =>
    api.put<Proposal>(`/api/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/api/proposals/${id}`),

  // ✅ FIXED ENDPOINT
  exportPdf: (id: string) =>
    api.get(`/api/proposals/${id}/export-pdf`, { responseType: "blob" }),
  exportDocx: (id: string) =>
    api.get(`/api/proposals/${id}/export-docx`, { responseType: "blob" }),
};

export default api;
