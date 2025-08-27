import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAllComments } from "../../../services/commentService";

const Comment = () => {
  const { id } = useParams(); // service_id
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await getAllComments(id);
        console.log("Kết quả từ API:", res);

        if (Array.isArray(res)) {
          setComments(res);
        } else if (res?.data && Array.isArray(res.data)) {
          setComments(res.data);
        } else {
          console.warn("Không có dữ liệu hợp lệ:", res);
        }
      } catch (error) {
        console.error("Lỗi khi lấy bình luận:", error);
      }
    };

    fetchComments();
  }, [id]);

  return (
    <div className="container mt-4">
      <h3 className="text-center">Bình luận của dịch vụ #{id}</h3>
      <div className="mb-3">
        <Link to="/admin/services" className="btn btn-secondary">
          ← Quay lại danh sách dịch vụ
        </Link>
      </div>
      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Người dùng</th>
            <th>Email</th>
            <th>Nội dung</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {comments.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                Không có bình luận nào.
              </td>
            </tr>
          ) : (
            comments.map((cmt, index) => (
              <tr key={cmt.id}>
                <td>{index + 1}</td>
                <td>{cmt.user?.name || "Ẩn danh"}</td>
                <td>{cmt.user?.email || "Không rõ"}</td>
                <td>{cmt.content}</td>
                <td>
                  {cmt.status === 1 ? (
                    <span className="badge bg-success">Hiển thị</span>
                  ) : (
                    <span className="badge bg-secondary">Ẩn</span>
                  )}
                </td>
                <td>
                  {cmt.created_at
                    ? new Date(cmt.created_at).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Comment;
