// import api from './axios';
//
// /* ===== Storage ===== */
// export const saveAuth = ({ token, user }) => {
//   if (token) {
//     localStorage.setItem('token', token);
//     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   }
//   if (user) {
//     localStorage.setItem('user', JSON.stringify(user));
//   }
// };
// export const getToken = () => localStorage.getItem('token') || null;
// export const getUser  = () => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } };
// export const clearAuth = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); delete api.defaults.headers.common['Authorization']; };
//
// export const isAdmin = (u = getUser()) =>
//     u?.role === true || u?.is_admin === true || u?.role?.name === 'admin' || u?.role === 'admin';
//
// /* ===== API ===== */
// export const login = (email, password) =>
//     api.post('auth/login', { email, password }).then(r => r.data);
//
// export const register = (payload) =>
//     api.post('auth/register', payload).then(r => r.data);
//
// export const serverLogout = () =>
//     api.post('auth/logout').then(r => { clearAuth(); return r.data; }).catch(() => clearAuth());
//
// export const fetchMe = () =>
//     api.get('auth/user').then(r => r.data);
//
// /* ===== Google Login ===== */
// export const loginWithGoogleToken = (idToken) =>
//     api.post('auth/google/token', { id_token: idToken }).then(r => r.data);
//
// /* ===== Aliases (giữ tương thích code cũ) ===== */
// export const getUserFromStorage = getUser;
// export const removeUserFromStorage = clearAuth;
// export const getTokenFromStorage = getToken;
// export const logout = serverLogout;


import api from './axios';

/* ===== Storage ===== */
export const saveAuth = ({ token, user }) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getToken = () => localStorage.getItem('token') || null;

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.common['Authorization'];
};

/* ===== Role / Permissions ===== */
// Backend: role = 0 => admin, role = 1 => user
export const isAdmin = (u = getUser()) => u?.role === 0;

/* ===== API ===== */
export const login = (email, password) =>
    api.post('auth/login', { email, password }).then(r => r.data);

export const register = (payload) =>
    api.post('auth/register', payload).then(r => r.data);

export const serverLogout = () =>
    api.post('auth/logout')
        .then(r => { clearAuth(); return r.data; })
        .catch(() => clearAuth());

export const fetchMe = () =>
    api.get('auth/user').then(r => r.data);

/* ===== Google Login ===== */
// Đăng nhập với Google token
export const loginWithGoogleToken = async (idToken) => {
  try {
    // Sử dụng instance api đã import từ './axios'
    const response = await api.post("auth/google/token", {
      id_token: idToken, // backend chấp nhận id_token
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
/* ===== Aliases (giữ tương thích code cũ) ===== */
export const getUserFromStorage = getUser;
export const removeUserFromStorage = clearAuth;
export const getTokenFromStorage = getToken;
export const logout = serverLogout;
