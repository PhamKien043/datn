import axios from "./axios";

export const getVenues = async ({ search = "", page = 1 }) => {
  const res = await axios.get("venues", {
    params: { search, page },
  });
  return res.data;
};

export const getVenueById = async (id) => {
  const response = await axios.get(`/venues/${id}`);
  return response.data;
};

export const deleteVenue = async (id) => {
  const res = await axios.delete(`venues/${id}`);
  return res.data;
};

export const addVenue = async (formData) => {
  const res = await axios.post("venues", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateVenue = async (id, formData) => {
  const res = await axios.post(`venues/${id}?_method=PUT`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
