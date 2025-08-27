import instance from "./axios";

// Lấy danh sách
export const getCategoryMenus = () => {
  return instance.get("admin/category_menus");
};

// Lấy chi tiết
export const getCategoryMenuById = (id) => {
  return instance.get(`admin/category_menus/${id}`);
};

// Thêm mới
export const createCategoryMenu = (data) => {
  return instance.post("admin/category_menus", data);
};

// Cập nhật
export const updateCategoryMenu = (id, data) => {
  return instance.put(`admin/category_menus/${id}`, data);
};

// Xóa
export const deleteCategoryMenu = (id) => {
  return instance.delete(`admin/category_menus/${id}`);
};

// Check trùng tên
export const checkCategoryMenuName = (name, id = null) => {
  return instance.post("admin/category_menus/check-name", { name, id });
};

// Lấy danh sách rút gọn (chỉ array)
export const getCategoryMenuListOnly = async () => {
  const res = await instance.get("admin/category_menus");
  return Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
};
