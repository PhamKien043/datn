// import axios from "./axios";
//
// // Lấy tất cả user
// export const getAllUsers = async () => {
//   try {
//     const response = await axios.get("users");
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
//
//
// // Tạo user mới
// export const createUser = async (data) => {
//   try {
//     const response = await axios.post("users", data);
//     return response.data;
//   } catch (error) {
//     throw error;
//   }
// };
//
//
// // Kiểm tra trùng username hoặc email
// // Giả sử backend có endpoint: GET /users/check-unique?field=username&value=abc&id=1 (id là tùy chọn để bỏ qua user id đó khi sửa)
// export const checkUnique = async (field, value, id = null) => {
//   try {
//     let url = `users/check-unique?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
//     if (id) url += `&id=${id}`;
//     const response = await axios.get(url);
//     // backend trả về { exists: true/false }
//     return response.data.exists;
//   } catch (error) {
//     throw error;
//   }
// };

import axios from "./axios";

// Lấy tất cả user
export const getAllUsers = async () => {
  try {
    const response = await axios.get("users");
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

// Lấy 1 user theo id
export const getUserById = async (id) => {
  try {
    const response = await axios.get(`users/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

// Tạo user
export const createUser = async (data) => {
  try {
    // Nếu không gửi role, mặc định là User (1)
    // Nếu frontend gửi role="0" => Admin, "1" => User
    if (!data.role && data.role !== 0) data.role = 1;
    else data.role = data.role == "0" ? 0 : 1;

    const response = await axios.post("users", data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};


// Cập nhật user
export const updateUser = async (id, data) => {
  try {
    const response = await axios.put(`users/${id}`, data);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

// Xóa user
export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`users/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

// Kiểm tra trùng username, email, name
export const checkUnique = async (field, value, id = null) => {
  try {
    let url = `/users/check-unique?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`;
    if (id) url += `&id=${id}`;
    const response = await axios.get(url);
    return response.data.exists; // true/false
  } catch (error) {
    console.error("Check unique error:", error);
    return false; // mặc định false nếu có lỗi
  }
};
// Toggle status user
export const toggleUserStatus = async (id) => {
  try {
    const response = await axios.patch(`users/${id}/status`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    return { success: false, error: error.response?.data || error.message };
  }
};