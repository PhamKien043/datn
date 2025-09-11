import axios from "./axios";

// Lấy danh sách comment (có filter serviceId)
export const fetchComments = async (serviceId) => {
  try {
    const url = serviceId ? `/comments?service_id=${serviceId}` : "/comments";
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Lỗi API fetchComments:", error);
    throw error;
  }
};

// Cập nhật trạng thái bình luận
export const updateCommentStatus = async (id, status) => {
  try {
    const response = await axios.put(`/comments/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Lỗi API updateCommentStatus:", error);
    throw error;
  }
};

// Gửi bình luận mới
export const postComment = async (data) => {
  try {
    const response = await axios.post("/comments", data);
    return response.data;
  } catch (error) {
    console.error("Lỗi API postComment:", error);
    throw error;
  }
};

export const updateComment = async (id, data) => {
  try {
    const response = await axios.put(`/comments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Lỗi updateComment:", error);
    throw error;
  }
};
// Xóa bình luận
export const deleteComment = async (id) => {
  try {
    const response = await axios.delete(`/comments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi API deleteComment:", error);
    throw error;
  }
};
