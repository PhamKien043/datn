import axios from "./axios"; // axios đã cấu hình baseURL = http://127.0.0.1:8000/api/

// Lấy toàn bộ danh mục
export const getAllCategories = async () => {
  try {
    const res = await axios.get("category-services");
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục:", error);
    throw error;
  }
};

// Lấy 1 danh mục theo ID
export const getCategoryById = async (id) => {
  try {
    const res = await axios.get(`category-services/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh mục ID ${id}:`, error);
    throw error;
  }
};

// Thêm danh mục mới
export const addCategory = async (data) => {
  try {
    const res = await axios.post("category-services", data);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi thêm danh mục:", error);
    throw error;
  }
};

// Cập nhật danh mục theo ID
export const updateCategory = async (id, data) => {
  try {
    const res = await axios.post(`category-services/${id}?_method=PUT`, data); // sử dụng _method=PUT nếu gửi dạng form
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật danh mục ID ${id}:`, error);
    throw error;
  }
};

// Xoá danh mục theo ID
export const deleteCategory = async (id) => {
  try {
    const res = await axios.delete(`category-services/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Lỗi khi xoá danh mục ID ${id}:`, error);
    throw error;
  }
};
