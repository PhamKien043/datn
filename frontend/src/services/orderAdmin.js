import instance from "./axios"; // axios instance bạn đã config

export const getUnreadCount = async () => {
  const response = await instance.get("admin/orders/unread-count");
  return response.data?.count ?? 0;
};

// Lấy số đơn hàng chưa đọc
export const getUnreadOrders = async () => {
  const response = await instance.get("admin/orders/unread-count");
  return response.data?.count ?? 0;
};

// Đánh dấu đơn hàng là đã đọc
export const markOrderAsRead = async (id) => {
  try {
    const response = await instance.post(`admin/orders/${id}/mark-read`);
    return response.data?.success ?? false;
  } catch (error) {
    console.error("Lỗi khi đánh dấu đơn hàng đã đọc:", error);
    return false;
  }
};

// Đánh dấu tất cả đơn hàng đã đọc
export const markOrdersAsRead = async () => {
  try {
    const response = await instance.post("admin/orders/mark-all-read");
    return response.data?.success ?? false;
  } catch (error) {
    console.error("Lỗi khi đánh dấu đơn hàng đã đọc:", error);
    return false;
  }
};