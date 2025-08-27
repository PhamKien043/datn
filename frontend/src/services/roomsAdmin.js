import instance from "./axios";

export const getAllRooms = async () => {
  try {
    const response = await instance.get("admin/rooms");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await instance.get(`admin/rooms/${id}`);
    return response.data.room || response.data.data || response.data;
  } catch (error) {
    console.error("Lỗi khi lấy phòng:", error.response?.data || error.message);
    throw error;
  }
};

export const createRoom = async (formData) => {
  try {
    const response = await instance.post("admin/rooms", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
      throw new Error(`Lỗi validation: ${errorMessages}`);
    }
    throw error;
  }
};
export const updateRoom = async (id, formData) => {
  try {
    formData.append('_method', 'PUT'); // 👈 spoof method để Laravel hiểu PUT
    const response = await instance.post(`admin/rooms/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const deleteRoom = async (id) => {
  try {
    const response = await instance.delete(`admin/rooms/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkRoomName = async (name) => {
  try {
    const response = await instance.get(`admin/rooms/check-name?name=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
