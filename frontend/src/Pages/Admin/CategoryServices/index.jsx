import React, { useEffect, useState } from "react";
import { getAllCategories, deleteCategory } from "../../../services/categoryServices";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xoá danh mục này?")) {
      try {
        await deleteCategory(id);
        toast.success("Xoá danh mục thành công");
        fetchCategories();
      } catch (err) {
        toast.error("Xoá danh mục thất bại", err);
      }
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "" || cat.status?.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid">
      <h1 className="h3 mb-2 text-gray-800">Quản lý danh mục</h1>
      <p className="mb-4">Xem và quản lý tất cả danh mục sản phẩm</p>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm theo tên danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Hiện</option>
            <option value="0">Ẩn</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={fetchCategories}>
            Làm mới
          </button>
        </div>
        <div className="col-md-3 text-end">
          <Link to="/admin/category-services/add" className="btn btn-success">
            Thêm danh mục
          </Link>
        </div>
      </div>

      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Danh sách danh mục</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center">Không có danh mục nào</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.id}</td>
                      <td>{cat.name}</td>
                      <td>{cat.description || "Không có"}</td>
                      <td>
                        <span
                          className={`badge ${
                            cat.status ? "bg-success" : "bg-secondary"
                          }`}
                        >
                          {cat.status ? "Hiện" : "Ẩn"}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/category-services/edit/${cat.id}`}
                          className="btn btn-sm btn-warning me-2"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default CategoryList;
