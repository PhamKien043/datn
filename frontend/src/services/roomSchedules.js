// src/services/roomSchedules.js
import axios from "./axios"; // ✅ Instance axios với baseURL đã config

const API_URL = "/admin/schedules";

/**
 * Lấy danh sách lịch đặt phòng (có phân trang + filter theo ngày)
 */
export const getSchedules = async (params = {}) => {
    try {
        const response = await axios.get(API_URL, { params });

        // Kiểm tra cấu trúc API trả về
        if (
            !response.data ||
            !response.data.data ||
            !Array.isArray(response.data.data.items)
        ) {
            console.error("API Response:", response.data);
            throw new Error("Invalid API response structure");
        }

        return {
            data: response.data.data.items,
            pagination: response.data.data.pagination
        };
    } catch (error) {
        console.error("API Error Details:", {
            url: API_URL,
            error: error.response?.data || error.message
        });
        throw error;
    }
};

/**
 * Xóa một lịch đặt phòng theo ID
 */
export const deleteSchedule = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Delete Error:", error.response?.data);
        throw error;
    }
};
