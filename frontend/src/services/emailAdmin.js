import axios from "./axios";
import instance from "./api";

// ✅ Lấy danh sách email (object phân trang)
export const getAllEmails = async () => {
  const response = await axios.get("/admin/email"); // thêm /admin
  return response.data.data;
};

// ✅ Lấy chi tiết email
export const getEmailById = async (id) => {
  try {
    const response = await instance.get(`admin/email/${id}`); // ✅ đổi blogs -> blog
    return response.data?.data || null;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết email:", error);
    throw new Error("Không thể lấy thông tin email");
  }
};

// Lấy số email chưa đọc
export const getUnreadCount = async () => {
  try {
    const response = await instance.get("admin/emails/unread-count");
    return response.data?.count ?? 0;
  } catch (error) {
    console.error("Lỗi khi lấy số email chưa đọc:", error);
    throw new Error("Không thể lấy số email chưa đọc");
  }
};

// Đánh dấu tất cả email đã đọc
export const markEmailsAsRead = async () => {
  try {
    const response = await instance.post("admin/emails/mark-read");
    return response.data?.success ?? false;
  } catch (error) {
    console.error("Lỗi khi đánh dấu email đã đọc:", error);
    throw new Error("Không thể cập nhật trạng thái email");
  }
};