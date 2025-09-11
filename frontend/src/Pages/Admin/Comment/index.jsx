import React, { useEffect, useState, useMemo } from "react";
import {
  fetchComments,
  updateCommentStatus,
  deleteComment,
} from "../../../services/commentService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2 } from "lucide-react";

const itemsPerPage = 5;

const CommentAdmin = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState(null);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetchComments();
      if (res.success) setComments(res.data);
      else toast.error("Không thể tải bình luận: " + res.message);
    } catch (err) {
      toast.error("Lỗi server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (loading) return;
    setLoading(true);
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const res = await updateCommentStatus(id, newStatus);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
        toast.success("Cập nhật thành công");
      } else {
        toast.error("Cập nhật thất bại: " + res.message);
      }
    } catch (err) {
      toast.error("Lỗi cập nhật: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setCommentIdToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setCommentIdToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    if (!commentIdToDelete) return;
    setLoading(true);
    try {
      const res = await deleteComment(commentIdToDelete);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentIdToDelete));
        toast.success("Xóa thành công");
      } else {
        toast.error("Xóa thất bại: " + res.message);
      }
    } catch (err) {
      toast.error("Lỗi xóa: " + err.message);
    } finally {
      closeDeleteModal();
      setLoading(false);
    }
  };

  const filteredComments = useMemo(() => {
    return comments
      .filter((cmt) =>
        [cmt.user?.name, cmt.user?.email, cmt.service?.name, cmt.content]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortAsc ? dateA - dateB : dateB - dateA;
      });
  }, [comments, searchQuery, sortAsc]);

  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const displayedComments = filteredComments.slice(indexOfFirst, indexOfLast);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  return (
    <div className="container-fluid">
      <ToastContainer />
      <h1 className="h3 mb-2 text-gray-800">Quản lý bình luận</h1>
      <p className="mb-4">Xem và xử lý bình luận người dùng</p>

      {/* Search & Sort */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            placeholder="Tìm kiếm bình luận"
            className="form-control"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            disabled={loading}
          />
        </div>
        <div className="col-md-6 text-end">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setSortAsc(!sortAsc)}
            disabled={loading}
          >
            Sắp xếp theo ngày: {sortAsc ? "cũ → mới" : "mới → cũ"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Danh sách bình luận</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center">Không tìm thấy bình luận phù hợp.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-bordered table-hover" width="100%" cellSpacing="0">
                  <thead className="bg-white text-dark">
                    <tr>
                      <th>#</th>
                      <th>Người dùng</th>
                      <th>Email</th>
                      <th>Dịch vụ</th>
                      <th>Đánh giá</th>
                      <th>Nội dung</th>
                      <th>Trạng thái</th>
                      <th>Giờ - ngày</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedComments.map((cmt, idx) => (
                      <tr key={cmt.id}>
                        <td>{indexOfFirst + idx + 1}</td>
                        <td>{cmt.user?.name || "Ẩn danh"}</td>
                        <td>{cmt.user?.email || "N/A"}</td>
                        <td>{cmt.service?.name || "N/A"}</td>
                        <td>{"⭐".repeat(cmt.rating || 0)}</td>
                        <td>{cmt.content}</td>
                        <td>
                          <span
                            className={`badge bg-${
                              cmt.status === 1 ? "success" : "secondary"
                            } me-2`}
                            style={{ cursor: loading ? "not-allowed" : "pointer" }}
                            onClick={() => !loading && toggleStatus(cmt.id, cmt.status)}
                          >
                            {cmt.status === 1 ? "Hiển thị" : "Ẩn"}
                          </span>
                        </td>
                        <td>{new Date(cmt.updated_at || cmt.created_at).toLocaleString("vi-VN")}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => !loading && openDeleteModal(cmt.id)}
                            disabled={loading}
                            title="Xóa bình luận"
                          >
                            <Trash2 size={16} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination d-flex justify-content-center align-items-center mt-3">
                  <button
                    className="btn btn-outline-secondary btn-sm me-1"
                    onClick={() => changePage(1)}
                    disabled={currentPage === 1}
                  >
                    ««
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm me-1"
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    «
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      className={`btn btn-sm me-1 ${
                        currentPage === i + 1 ? "btn-primary" : "btn-outline-secondary"
                      }`}
                      onClick={() => changePage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline-secondary btn-sm me-1"
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    »
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => changePage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    »»
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="position-fixed top-0 start-0 vw-100 vh-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50"
          style={{ zIndex: 1050 }}
        >
          <div className="bg-white p-4 rounded shadow" style={{ maxWidth: "400px", width: "90%" }}>
            <p>Bạn có chắc muốn xoá bình luận này?</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-danger me-2" onClick={confirmDelete} disabled={loading}>
                Xác nhận
              </button>
              <button className="btn btn-secondary" onClick={closeDeleteModal} disabled={loading}>
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentAdmin;
