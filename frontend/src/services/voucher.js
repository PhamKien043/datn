import axios from "./axios";

// ✅ Lấy danh sách voucher (object phân trang)
export const getAllVouchers = async () => {
    const response = await axios.get("/admin/voucher"); // thêm /admin
    return response.data.data;
};

// ✅ Thêm voucher mới
export const createVoucher = async (voucherData) => {
    const response = await axios.post("/admin/voucher", voucherData); // thêm /admin
    return response.data;
};

// ✅ Lấy chi tiết voucher
export const getVoucherById = async (id) => {
    const response = await axios.get(`/admin/voucher/${id}`); // thêm /admin
    return response.data.data;
};

// ✅ Cập nhật voucher
export const updateVoucher = async (id, voucherData) => {
    const response = await axios.put(`/admin/voucher/${id}`, voucherData); // thêm /admin
    return response.data.data;
};

// ✅ Xóa voucher
export const deleteVoucher = async (id) => {
    const response = await axios.delete(`/admin/voucher/${id}`); // thêm /admin
    return response.data;
};

// ✅ Check tên voucher trùng
export const checkVoucherName = async (title, id = null) => {
    try {
        const params = { title: title.trim() };
        if (id) params.id = id;

        const response = await axios.get('/admin/voucher/check-name', { params }); // thêm /admin
        return response.data.exists;
    } catch (error) {
        console.error('Error checking voucher name:', error);
        return true; // Mặc định coi như bị trùng nếu có lỗi
    }
};
