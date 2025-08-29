import axios from "./axios";
import instance from "./api";

// ✅ Lấy danh sách blog (object phân trang)
export const getAllBlogs = async () => {
  const response = await axios.get("/admin/blog"); // thêm /admin
  return response.data.data;
};

// ✅ Thêm blog mới
export const createBlog = async (blogData) => {
  const response = await axios.post("/admin/blog", blogData); // thêm /admin
  return response.data;
};

// ✅ Lấy chi tiết blog
export const getBlogById = async (id) => {
  try {
    const response = await instance.get(`admin/blog/${id}`); // ✅ đổi blogs -> blog
    return response.data?.data || null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết blog:", error);
    throw new Error("Không thể lấy thông tin blog");
  }
};

// ✅ Cập nhật blog
export const updateBlog = async (id, formData) => {
  try {
    // Nếu image không phải File thì bỏ
    const imageFile = formData.get("image");
    if (!(imageFile instanceof File)) {
      formData.delete("image");
    }

    // Laravel hỗ trợ method spoofing qua _method
    formData.append("_method", "PUT");

    const response = await instance.post(`admin/blog/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors || {};
      const errorMessages = Object.values(errors).flat().join(", ");
      throw new Error(errorMessages || "Dữ liệu không hợp lệ");
    }
    throw new Error(error.response?.data?.message || "Cập nhật blog thất bại");
  }
};



// ✅ Xóa blog
export const deleteBlog = async (id) => {
  const response = await axios.delete(`/admin/blog/${id}`); // thêm /admin
  return response.data;
};

// ✅ Check tên blog trùng
export const checkBlogTitle = async (title, id = null) => {
  try {
    const response = await instance.post("admin/blog/check-name", { title, id });

    if (typeof response.data?.exists !== "boolean") {
      console.warn("API checkBlogTitle không trả về exists hợp lệ");
      return false;
    } else if (response.data?.exists) {
      console.warn("Tên blog đã tồn tại");
      return true;
    }

    return response.data.exists;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tên blog:", error);
    throw new Error("Không thể kiểm tra tên blog");
  }
};
