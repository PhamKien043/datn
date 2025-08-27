import instance from "./axios";

// Lấy danh sách menu
export const getAllMenus = async (params = {}) => {
  try {
    const response = await instance.get("admin/menus", { params });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách menu:", error);
    throw new Error("Không thể lấy danh sách menu");
  }
};

// Lấy chi tiết menu theo id
export const getMenuById = async (id) => {
  try {
    const response = await instance.get(`admin/menus/${id}`);
    return response.data?.data || null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết menu:", error);
    throw new Error("Không thể lấy thông tin menu");
  }
};

// Tạo menu mới
export const createMenu = async (formData) => {
  try {
    const response = await instance.post("admin/menus", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).flat().join(", ");
      throw new Error(errorMessages || "Dữ liệu không hợp lệ");
    }
    throw new Error(error.response?.data?.message || "Tạo menu thất bại");
  }
};

// Cập nhật menu
export const updateMenu = async (id, formData) => {
  try {
    const imageFile = formData.get("image");
    if (!(imageFile instanceof File)) formData.delete("image");

    const response = await instance.post(`admin/menus/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).flat().join(", ");
      throw new Error(errorMessages || "Dữ liệu không hợp lệ");
    }
    throw new Error(error.response?.data?.message || "Cập nhật menu thất bại");
  }
};

// Xóa menu
export const deleteMenu = async (id) => {
  try {
    const response = await instance.delete(`admin/menus/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Xóa menu thất bại");
  }
};

// Kiểm tra trùng tên menu
export const checkMenuName = async (name, id = null) => {
  try {
    const response = await instance.post("admin/menus/check-name", { name, id });

    if (typeof response.data?.exists !== "boolean") {
      console.warn("API checkMenuName không trả về giá trị exists hợp lệ");
      return false;
    }

    return response.data.exists;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tên menu:", error);
    throw new Error("Không thể kiểm tra tên menu");
  }
};
