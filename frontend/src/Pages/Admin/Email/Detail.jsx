import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getEmailById } from "../../../services/emailAdmin"; // 👈 service lấy 1 email
import "react-toastify/dist/ReactToastify.css";
import "./detail.css";

function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Lấy email từ API
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const data = await getEmailById(id);
        setEmail(data);
      } catch (err) {
        console.error("Lỗi khi load email:", err);
        toast.error("❌ Không thể tải dữ liệu email");
        navigate("/admin/emails");
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, [id, navigate]);

  if (loading) return <p>⏳ Đang tải dữ liệu...</p>;
  if (!email) return <p>❌ Không tìm thấy email</p>;

  return (
    <div className="email-detail-container">
      <div className="email-detail-header">
        <h2>📧 Chi tiết Email</h2>
        <button
          className="btn-back"
          onClick={() => navigate("/admin/emails")}
        >
          ← Quay lại
        </button>
      </div>

      <div className="email-detail-card">
        <div className="detail-item">
          <strong>👤 Họ tên:</strong> {email.name}
        </div>
        <div className="detail-item">
          <strong>📩 Email:</strong> {email.email}
        </div>
        <div className="detail-item">
          <strong>📞 Số điện thoại:</strong> {email.phone || "—"}
        </div>
        <div className="detail-item">
          <strong>📝 Nội dung:</strong>
          <p className="message-box">{email.message}</p>
        </div>
        <div className="detail-item">
          <strong>⏰ Ngày gửi:</strong>{" "}
          {new Date(email.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default EmailDetail;
