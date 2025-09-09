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
  const response = await instance.get("admin/emails/unread-count");
  return response.data?.count ?? 0;
};


// Đánh dấu tất cả email đã đọc
export const markEmailAsRead = async (id) => {
  try {
    const response = await instance.post(`admin/emails/${id}/mark-read`);
    return response.data?.success ?? false;
  } catch (error) {
    console.error("Lỗi khi đánh dấu email đã đọc:", error);
    throw new Error("Không thể cập nhật trạng thái email");
  }
};

// Gửi phản hồi email
export const sendEmailReply = async (id, replyMessage) => {
  try {
    const response = await instance.post(`admin/emails/${id}/reply`, {
      message: replyMessage,
    });
    return response.data.data; // ⚡ lấy object email đã cập nhật
  } catch (error) {
    console.error("Lỗi khi gửi phản hồi:", error);
    throw new Error("Không thể gửi phản hồi email");
  }
};

const handleSendReply = async () => {
  if (!replyMessage.trim()) {
    toast.warning("⚠️ Vui lòng nhập nội dung phản hồi!");
    return;
  }
  setSending(true);
  try {
    const updatedEmail = await sendEmailReply(id, replyMessage);
    toast.success("Phản hồi đã được gửi tới khách hàng!");

    setEmail(updatedEmail); // ✅ cập nhật state email
    setReplyMessage(updatedEmail.reply_message); // ✅ giữ lại nội dung phản hồi
  } catch (err) {
    toast.error("Gửi phản hồi thất bại!");
  } finally {
    setSending(false);
  }
};

