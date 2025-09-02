import React, { useEffect, useState } from "react";
import { fetchComments, postComment } from "../../../services/commentService";
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

  // Load danh sách bình luận theo serviceId
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
    if (!currentUser?.id) return toast.error("Khách hàng cần đăng nhập để bình luận.");
    if (!newComment.trim()) return toast.error("Vui lòng nhập bình luận.");
    if (!rating) return toast.error("Vui lòng chọn số sao đánh giá.");

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
        // Ưu tiên dùng dữ liệu server trả về (đã có created_at, user, ...)
        setComments((prev) => [res.data, ...prev]);
        setNewComment("");
        setRating(5);
        setHover(0);
        toast.success("Gửi bình luận thành công!");
      } else {
        toast.error(res?.message || "Khách hàng chưa đủ điều kiện để bình luận.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Lỗi khi gửi bình luận.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "80%", margin: "auto", fontSize: 18, lineHeight: 1.6 }}>
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
                aria-label={`${i} sao`}
                onClick={() => !loading && setRating(i)}
                onMouseEnter={() => !loading && setHover(i)}
                onMouseLeave={() => !loading && setHover(0)}
                onKeyDown={(e) => e.key === "Enter" && !loading && setRating(i)}
                style={{
                  cursor: loading ? "not-allowed" : "pointer",
                  color: i <= (hover || rating) ? "#f5b50a" : "#ddd",
                  fontSize: 28,
                  marginRight: 8,
                  userSelect: "none",
                  transition: "color 0.15s ease",
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
          Khách hàng cần đăng nhập để bình luận.
        </p>
      )}

      <hr />

      {comments.filter(c => c.status === 1).length === 0 ? (
        <p style={{ color: "#777" }}>Chưa có bình luận nào.</p>
      ) : (
       comments.filter(c => c.status === 1).map((c) => (
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
                  {c.created_at ? timeAgo(c.created_at) : ""}
                </small>
              </div>
              <StarRating rating={Number(c.rating) || 0} />
              <p style={{ whiteSpace: "pre-line", color: "#555", marginTop: 4 }}>
                {c.content}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
