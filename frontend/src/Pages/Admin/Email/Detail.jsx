import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getEmailById, sendEmailReply } from "../../../services/emailAdmin";
import "react-toastify/dist/ReactToastify.css";
import "./detail.css";

function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Lấy email từ API
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const data = await getEmailById(id);
        setEmail(data);
        if (data.reply_message) {
          setReplyMessage(data.reply_message);
        }
      } catch (err) {
        toast.error("Không thể tải dữ liệu email");
        navigate("/admin/emails");
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, [id, navigate]);

  // Hàm gửi / cập nhật phản hồi
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.warning("⚠️ Vui lòng nhập nội dung phản hồi!");
      return;
    }
    setSending(true);
    try {
      const updatedEmail = await sendEmailReply(id, replyMessage); // API trả về email đã update
      toast.success(
        email?.is_replied
          ? "Phản hồi đã được cập nhật!"
          : "Phản hồi đã được gửi tới khách hàng!"
      );
      setEmail(updatedEmail);
      setReplyMessage(updatedEmail.reply_message); // ✅ giữ lại nội dung phản hồi
    } catch (err) {
      toast.error("Gửi phản hồi thất bại!");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="my-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Đang tải dữ liệu email...</p>
      </div>
    );
  }

  if (!email) return <p>Không tìm thấy email</p>;

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

      {/* Form phản hồi */}
      <div className="reply-section">
        <div className="reply-header">
          <h3>✉️ Phản hồi khách hàng</h3>
          <button
            className="btn-send"
            onClick={handleSendReply}
            disabled={sending}
          >
            {sending
              ? "⏳ Đang gửi..."
              : email?.is_replied
                ? "🔄 Cập nhật phản hồi"
                : "📨 Gửi phản hồi"}
          </button>
        </div>
        <textarea
          className="reply-box"
          placeholder="Nhập nội dung phản hồi..."
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
        />
      </div>

    </div>
  );
}

export default EmailDetail;
