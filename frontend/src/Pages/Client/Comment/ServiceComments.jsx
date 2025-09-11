import React, { useEffect, useState } from "react";
import {
  fetchComments,
  postComment,
  updateComment,
  deleteComment,
} from "../../../services/commentService";
import { toast } from "react-toastify";

function StarRating({ rating }) {
  return (
    <div style={{ color: "#f5b50a", fontSize: 18, userSelect: "none" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const steps = [
    { unit: "năm", s: 31536000 },
    { unit: "tháng", s: 2592000 },
    { unit: "ngày", s: 86400 },
    { unit: "giờ", s: 3600 },
    { unit: "phút", s: 60 },
  ];
  for (const step of steps) {
    if (seconds >= step.s) {
      const count = Math.floor(seconds / step.s);
      return `${count} ${step.unit} trước`;
    }
  }
  return "Vừa xong";
}

export default function ServiceComments({ serviceId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchComments(serviceId);
        if (res?.success) setComments(res.data || []);
      } catch {
        toast.error("Không thể tải bình luận.");
      }
    })();
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return toast.error("Bạn cần đăng nhập.");
    if (!newComment.trim()) return toast.error("Vui lòng nhập nội dung.");
    if (!rating) return toast.error("Vui lòng chọn sao đánh giá.");

    const payload = {
      content: newComment.trim(),
      user_id: currentUser.id,
      service_id: serviceId,
      rating,
    };

    setLoading(true);
    try {
      const res = await postComment(payload);
      if (res?.success) {
        setComments((prev) => [res.data, ...prev]);
        setNewComment("");
        setRating(5);
        setHover(0);
        toast.success("Gửi bình luận thành công!");
      } else {
        toast.error(res?.message || "Không thể gửi bình luận.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi khi gửi bình luận.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setEditRating(comment.rating);
  };

const handleUpdate = async () => {
  if (!editContent.trim()) return toast.error("Nội dung không được trống.");
  try {
    const res = await updateComment(editingId, {
      content: editContent,
      rating: editRating,
      user_id: currentUser.id,
    });
    if (res?.success) {
      // Cập nhật comment trong state với dữ liệu trả về, bao gồm updated_at mới
     setComments((prev) =>
  prev.map((c) => (c.id === editingId ? { ...c, ...res.data, user: c.user } : c))
);

      toast.success("Cập nhật bình luận thành công!");
      setEditingId(null);
      setEditContent("");
      setEditRating(5); // reset rating khi kết thúc chỉnh sửa
    }
  } catch (err) {
    toast.error("Lỗi khi cập nhật bình luận.");
  }
};


  const handleDelete = async (commentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      const res = await deleteComment(commentId, currentUser.id);
      if (res?.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success("Xóa bình luận thành công!");
      }
    } catch {
      toast.error("Lỗi khi xóa bình luận.");
    }
  };

  return (
    <div style={{ width: "80%", margin: "auto", fontSize: 18 }}>
      <h4 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>
        Bình luận & Đánh giá
      </h4>

      {currentUser?.id ? (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 32,
            padding: 16,
            borderRadius: 8,
            backgroundColor: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <label htmlFor="commentText" style={{ fontWeight: 600 }}>
            Nội dung bình luận
          </label>
          <textarea
            id="commentText"
            rows={4}
            placeholder="Nhập bình luận..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              fontSize: 16,
              borderRadius: 6,
              padding: 10,
              marginTop: 8,
              marginBottom: 16,
              resize: "vertical",
            }}
          />

          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
            Đánh giá sao
          </label>
          <div style={{ marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => !loading && setRating(i)}
                onMouseEnter={() => !loading && setHover(i)}
                onMouseLeave={() => !loading && setHover(0)}
                style={{
                  cursor: loading ? "not-allowed" : "pointer",
                  color: i <= (hover || rating) ? "#f5b50a" : "#ddd",
                  fontSize: 28,
                  marginRight: 8,
                  userSelect: "none",
                }}
              >
                ★
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ fontSize: 16, padding: "10px 20px", borderRadius: 6 }}
          >
            {loading ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </form>
      ) : (
        <p style={{ fontSize: 18, fontStyle: "italic", color: "#555" }}>
          Bạn cần đăng nhập để bình luận.
        </p>
      )}

      <hr />

      {comments.filter((c) => c.status === 1).length === 0 ? (
        <p style={{ color: "#777" }}>Chưa có bình luận nào.</p>
      ) : (
        comments
          .filter((c) => c.status === 1)
          .map((c) => (
            <div
              key={c.id}
              className="d-flex mb-3"
              style={{
                gap: 12,
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                padding: 12,
                borderRadius: 8,
                backgroundColor: "#fafafa",
                alignItems: "flex-start",
                fontSize: 16,
              }}
            >
              <img
                src={
                  c.user?.avatar
                    ? `/storage/avatars/${c.user.avatar}`
                    : "https://cdn-icons-png.flaticon.com/512/607/607417.png"
                }
                alt={c.user?.name || "User"}
                className="rounded-circle"
                width={56}
                height={56}
                style={{ objectFit: "cover", border: "2px solid #f5b50a" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 17, color: "#333" }}>
                    {c.user?.name || "Người dùng"}
                  </strong>
               <small style={{ color: "#999" }}>
  {c.updated_at ? timeAgo(c.updated_at) : (c.created_at ? timeAgo(c.created_at) : "")}
  {c.updated_at && c.updated_at !== c.created_at && (
    <span style={{ marginLeft: 8, fontStyle: "italic", fontSize: 13, color: "#888" }}>
      (Đã chỉnh sửa)
    </span>
  )}
</small>


                </div>

                {editingId === c.id ? (
                  <>
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: "100%",
                        borderRadius: 4,
                        padding: 6,
                        marginTop: 6,
                        fontSize: 16,
                      }}
                    />
                    <div style={{ margin: "8px 0" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          onClick={() => setEditRating(i)}
                          style={{
                            cursor: "pointer",
                            color: i <= editRating ? "#f5b50a" : "#ddd",
                            fontSize: 20,
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div>
                      <button onClick={handleUpdate} className="btn btn-success btn-sm me-2">
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Huỷ
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <StarRating rating={Number(c.rating) || 0} />
                    <p style={{ whiteSpace: "pre-line", color: "#555", marginTop: 4 }}>
                      {c.content}
                    </p>

                    {currentUser?.id === c.user_id && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleEdit(c)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
