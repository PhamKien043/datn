import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServices, deleteService } from "../../../services/serviceService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getServices({ search, page });
      setServices(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (error) {
      toast.error("Không thể tải danh sách dịch vụ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá dịch vụ này?")) return;
    try {
      await deleteService(id);
      toast.success("Đã xoá thành công!");
      fetchServices();
    } catch (err) {
      toast.error("Xoá thất bại", err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, [page]);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Danh sách Dịch vụ</h2>

      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Nhập tên dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "250px" }}
        />
        <button className="btn btn-sm btn-outline-primary" onClick={handleSearch}>
          Tìm kiếm
        </button>
      </div>

      <div className="text-end mb-3">
        <Link to="/admin/services/add" className="btn btn-sm btn-success">
          Thêm dịch vụ
        </Link>
      </div>

      {loading ? (
        <div className="text-center">Đang tải dữ liệu...</div>
      ) : services.length === 0 ? (
        <div className="text-center">Không có dịch vụ nào</div>
      ) : (
        <>
          <table className="table table-bordered table-hover table-sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Hình ảnh</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Danh mục</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td>{service.name}</td>
                  <td>
                    {service.image ? (
                      <img
                        src={`http://localhost:8000/storage/services/${service.image}`}
                        alt={service.name}
                        width={60}
                        height={60}
                        style={{ objectFit: "cover", borderRadius: "5px" }}
                      />
                    ) : (
                      "Không có"
                    )}
                  </td>
                  <td>{service.description || "Không có"}</td>
                  <td>
                    <span
                      className={`badge ${
                        service.status ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {service.status ? "Hiển thị" : "Ẩn"}
                    </span>
                  </td>
                  <td>{service.category?.name || "Chưa phân loại"}</td>
                  <td>
                    <Link
                      to={`/admin/services/edit/${service.id}`}
                      className="btn btn-sm btn-warning me-2"
                    >
                      Sửa
                    </Link>
                    <button
                      className="btn btn-sm btn-danger me-2"
                      onClick={() => handleDelete(service.id)}
                    >
                      Xoá
                    </button>
                    <Link
                      to={`/admin/services/${service.id}/comments`}
                      className="btn btn-sm btn-info"
                    >
                      Bình luận
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Trang trước
            </button>
            <span>
              Trang {page} / {lastPage}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= lastPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      )}

      <ToastContainer />
    </div>
  );
};

export default Services;
