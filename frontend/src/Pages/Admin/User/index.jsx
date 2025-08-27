import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, updateUser } from "../../../services/userService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./User.css";

function User() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchRole, setSearchRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      console.log("API Response:", result); // Debug dữ liệu

      if (result && result.success) {
        const dataArray = Array.isArray(result.data?.data) 
          ? result.data.data 
          : Array.isArray(result.data) 
            ? result.data 
            : Array.isArray(result) 
              ? result 
              : [];

        // ép role về number để so sánh đúng
        const usersWithRoleNumber = dataArray.map(u => ({
          ...u,
          role: u.role !== undefined ? Number(u.role) : null
        }));

        setUsers(usersWithRoleNumber);
        setFilteredUsers(usersWithRoleNumber);
      } else {
        toast.error(result.error?.message || "Không thể tải danh sách users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Lỗi khi tải dữ liệu users");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let temp = [...users];
    if (searchName) {
      temp = temp.filter(u => u.name && u.name.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (searchRole) {
      temp = temp.filter(u => {
        const roleText = u.role === 0 ? "admin" : u.role === 1 ? "user" : "";
        return roleText.toLowerCase().includes(searchRole.toLowerCase());
      });
    }
    setFilteredUsers(temp);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchRole("");
    setFilteredUsers([...users]);
    setCurrentPage(1);
  };

  const handleStatusToggle = async (user) => {
    try {
      const updatedUser = { ...user, status: !user.status };
      const result = await updateUser(user.id, updatedUser);
      
      if (result && result.success) {
        toast.success("Cập nhật trạng thái thành công");
        fetchUsers(); // Load lại danh sách
      } else {
        toast.error(result.error?.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) return (
    <div className="my-5 text-center">
      <div className="spinner-border text-primary" role="status"></div>
      <p className="mt-3">Đang tải danh sách users...</p>
    </div>
  );

  return (
    <div className="menus-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="header-section">
        <h2>👥 Quản lý Users</h2>
        <button className="btn-add" onClick={() => navigate("/admin/users/add")}>
          + Thêm Mới
        </button>
      </div>

      <div className="menus-actions">
        <input
          type="text"
          placeholder="🔎 Tìm theo tên"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="text"
          placeholder="🔎 Tìm theo role"
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
        />
        <button className="btn-add" onClick={handleFilter}>
          Áp dụng
        </button>
        <button className="btn-add btn-outline-warning" onClick={handleReset}>
          Làm mới
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="no-data">Không có user nào phù hợp.</p>
      ) : (
        <>
          <table className="menus-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên</th>
                <th className="d-none d-md-table-cell">Username</th>
                <th className="d-none d-md-table-cell">Email</th>
                <th className="d-none d-md-table-cell">Vai trò</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, idx) => (
                <tr key={user.id || idx}>
                  <td>{indexOfFirst + idx + 1}</td>
                  <td>{user.name || "N/A"}</td>
                  <td className="d-none d-md-table-cell">{user.username || "N/A"}</td>
                  <td className="d-none d-md-table-cell">{user.email || "N/A"}</td>
                  <td className="d-none d-md-table-cell">
                    {user.role === 0 ? "Admin" : user.role === 1 ? "User" : "N/A"}
                  </td>
                  <td>
                    <button 
                      className={user.status ? "status-btn-active" : "status-btn-inactive"}
                      onClick={() => handleStatusToggle(user)}
                    >
                      {user.status ? "Kích hoạt" : "Khóa"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>««</button>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>«</button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>»</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default User;
