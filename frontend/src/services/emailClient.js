import axios from "./axios"; // axios instance bạn đã cấu hình

// ✅ Gửi thông tin liên hệ
export const sendContact = async (formData) => {
  try {
    const response = await axios.post("/emails", formData); // endpoint server của bạn
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Gửi liên hệ thất bại");
  }
};
