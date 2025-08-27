import axios from "./axios";

export const getServices = async ({ search = "", page = 1 }) => {
  return axios.get("services", { params: { search, page } });
};

export const getServiceById = async (id) => {
  return axios.get(`services/${id}`);
};

export const createService = async (formData) => {
  return axios.post("services", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const updateService = async (id, formData) => {
  formData.append("_method", "PUT"); // Laravel cần cái này
  return axios.post(`services/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


export const deleteService = async (id) => {
  return axios.delete(`services/${id}`);
};
