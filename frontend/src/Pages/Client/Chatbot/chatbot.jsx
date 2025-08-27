import React, { useState, useRef, useEffect } from "react";
import "../Chatbot/Chatbot.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { IoMdSend } from "react-icons/io";

const GEMINI_KEY = "AIzaSyAKLv9wV5QzFW_tgD1Zj9JKKOq3o7INr-E";

const thongtinHuanluyen =
    " 1. Thông tin chung về Website: đây là Website chuyên cung cấp dịch vụ tổ chức sự kiện tại nhà hàng.\n" +
    "  Tên: HappyEvent \n" +
    "  Địa chỉ: A12 Phan Văn Trị - Phường Hạnh Thông - Tp. Hồ Chí Minh\n" +
    "  Thời gian làm việc: Cửa hàng offline Thứ 2 - Chủ Nhật 8h-22h. Cửa hàng online luôn mở cửa 24/24"+
    "  Tư vấn dịch vụ: 0986256445\n" +
    "  Liên hệ đặt dịch vụ: 0986256445\n" +
    "  Email: happy000event@gmail.com\n" +
    " 2. Loại tiệc cung cấp\n" +
    "    Tiệc cưới: Không gian sang trọng, đa dạng kiểu trang trí theo chủ đề (cổ điển, hiện đại, thiên nhiên...). \n" +
    "    Dịch vụ kèm theo gồm: trang trí, âm thanh ánh sáng, MC, lễ tân, nghi thức cưới. \n" +
    "    Thực đơn đa dạng cho khách lựa chọn, từ truyền thống đến cao cấp. \n" +
    "    Phù hợp cho từ 100 - 500 khách. \n" +
    " 3. Dịch vụ và tiện ích đi kèm: \n" +
    "    Chọn loại phòng: Phòng Standard, phòng VIP, phòng Super VIP. \n" +
    "    Thực đơn đặt món: Chọn món ăn theo danh mục, phù hợp khẩu vị và ngân sách. \n" +
    "    Số lượng bàn: Có thể chọn số lượng bàn, mỗi bàn từ 6–10 người. \n" +
    "    Trang trí tiệc: Trang trí theo gói (đơn giản, cao cấp, theo chủ đề). \n" +
    "    Âm thanh – ánh sáng: Có sẵn hoặc nhà hàng sẽ thuê ngoài tùy theo quy mô tiệc. \n" +
    "    MC, ca sĩ, hoạt náo viên sẽ được nhà hàng tặng kèm. \n" +
    "    Chụp hình – quay phim: Dịch vụ chụp ảnh chuyên nghiệp. \n" +
    " 4. Cách đặt dịch vụ trên website: \n" +
    "  1 Vào trang dịch vụ. \n" +
    "  2 Chọn loại phòng, phòng và ngày giờ tổ chức tiệc \n" +
    "  3 Chọn món ăn và thêm vào giỏ hàng \n" +
    "  4 Chọn số lượng bàn và nhấn nút đặt dịch vụ ngay \n" +
    "  5 Chọn phương thức thanh toán MoMo hoặc VnPay \n" +
    "  5 Chọn voucher và áp dụng (nếu có) \n" +
    "  5 Cuối cùng là kiểm tra lại thật kỹ và nhấn thanh toán \n" +
    " 5. Chính sách & Cam kết: \n" +
    " - HappyEvent cam kết phục vụ đúng loại tiệc, đúng ngày giờ và đúng số lượng bàn đã đặt.\n" +
    " - Trang trí, món ăn, và các dịch vụ kèm theo sẽ được thực hiện đúng theo dịch vụ khách hàng đã chọn.\n" +
    " - Đảm bảo không thay đổi dịch vụ nếu chưa được sự đồng ý của khách hàng.\n" +
    " 6. Chính sách đặt cọc & thanh toán: \n" +
    " - Khách hàng cần thanh toán trước 30% giá trị đơn hàng để xác nhận đặt dịch vụ (cọc giữ chỗ).\n" +
    " - Số tiền đặt cọc KHÔNG HOÀN LẠI nếu khách hàng hủy đơn hoặc không đến đúng hẹn.\n" +
    " - Phần còn lại (70%) sẽ được thanh toán trước hoặc ngay tại thời điểm tổ chức tiệc.\n" +
    " - Trường hợp khách hủy tiệc sau khi đặt cọc: không hoàn lại tiền cọc 30%.\n" +
    " 7. Bảo mật thông tin: \n" +
    " - HappyEvent cam kết bảo mật toàn bộ thông tin khách hàng, không chia sẻ cho bên thứ ba. " +
    " 8. Hỗ trợ & chăm sóc sau sự kiện: \n" +
    " - Mọi phản hồi hoặc khiếu nại sẽ được tiếp nhận qua hotline 0986256445 hoặc email happy000event@gmail.com và xử lý trong vòng 24h.\n" ;

/* ===== utils ===== */
const nowTime = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const linkify = (text) =>
    (text || "")
        .replace(
            /\b(https?:\/\/[^\s<]+)/g,
            (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`
        )
        .replace(/\n/g, "<br>");

export default function Chatbot() {
    const [showChat, setShowChat] = useState(false);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const [messages, setMessages] = useState([
        { role: "model", text: "HappyEvent xin chào, bạn cần hỗ trợ gì?", time: nowTime() },
    ]);

    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const fetchProductFromBackend = async (query) => {
        try {
            const res = await fetch(`/api/chat/search?keyword=${encodeURIComponent(query)}`);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Search API error:", e);
            return [];
        }
    };

    const handleSend = async () => {
        const val = (input || "").trim();
        if (!val || sending) return;

        setSending(true);

        // push user msg
        const userMsg = { role: "user", text: linkify(val), time: nowTime() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        // Optional: tìm sản phẩm
        const products = await fetchProductFromBackend(val);

        let productIntroHTML = "";
        let productNames = "";
        if (products.length > 0) {
            productIntroHTML =
                "Tôi tìm thấy các sản phẩm phù hợp:<br>" +
                products
                    .map(
                        (p) =>
                            `🔗 <a href="/product/${p.id}" target="_blank" rel="noopener">${p.name}</a> - ${Number(
                                p.price || 0
                            ).toLocaleString()}₫`
                    )
                    .join("<br>") +
                "<br><br>";
            productNames = products.map((p) => p.name).join(", ");
        }

        const aiPrompt = productNames ? `Cho tôi biết thêm về các sản phẩm: ${productNames}` : val;

        // tạo sườn tin nhắn bot rỗng để stream vào
        let modelReply = productIntroHTML;
        const placeholder = { role: "model", text: modelReply || "Đang soạn…", time: nowTime() };
        setMessages((prev) => [...prev, placeholder]);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: thongtinHuanluyen }] },
                        contents: [
                            ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
                            { role: "user", parts: [{ text: aiPrompt }] },
                        ],
                    }),
                }
            );

            const reader = response.body
                .pipeThrough(new TextDecoderStream("utf-8"))
                .getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                value.split("data: ").forEach((chunk, idx) => {
                    if (!idx || !chunk.trim()) return;
                    try {
                        const json = JSON.parse(chunk);
                        const textChunk =
                            json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                        if (!textChunk) return;

                        modelReply += textChunk;
                        setMessages((prev) => {
                            const next = [...prev];
                            next[next.length - 1] = {
                                ...next[next.length - 1],
                                text: linkify(modelReply),
                            };
                            return next;
                        });
                    } catch { /* empty */ }
                });
            }
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    role: "model",
                    text: "Xin lỗi, hiện không thể phản hồi. Vui lòng thử lại sau.",
                    time: nowTime(),
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {!showChat && (
                <button
                    className="chat-toggle"
                    aria-label="Mở chat"
                    onClick={() => setShowChat(true)}
                    title="Chat với HappyEvent"
                >
                    <i className="fas fa-comments" />
                </button>
            )}

            {showChat && (
                <div className="chatwindow" role="dialog" aria-label="Hộp thoại chat">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="header-brand">
                            <div className="header-avatar">H</div>
                            <div className="header-text">
                                <div className="header-title">CSKH HappyEvent</div>
                                <div className="header-sub">
                                    Hotline: 0986.256.445 • 24/7
                                </div>
                            </div>
                        </div>
                        <div className="header-actions">
                            <button title="Thu nhỏ" onClick={() => setShowChat(false)}>
                                <i className="fas fa-minus" />
                            </button>
                            <button title="Đóng" onClick={() => setShowChat(false)}>
                                <i className="fas fa-times" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat" ref={chatRef}>
                        {messages.map((m, i) => {
                            const right = m.role === "user";
                            return (
                                <div key={i} className={`msg-row ${right ? "right" : "left"}`}>
                                    <div className="msg-avatar">{right ? "" : "AI"}</div>
                                    <div>
                                        <div
                                            className="msg-bubble"
                                            dangerouslySetInnerHTML={{ __html: m.text }}
                                        />
                                        <div className="msg-meta">{m.time || nowTime()}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <div className="inputarea">
                        <div className="input-wrap">
                            <button className="iconbtn" title="Đính kèm" type="button">
                                <i className="fas fa-paperclip" />
                            </button>
                            <input
                                type="text"
                                placeholder="Nhập nội dung, ví dụ: Tôi muốn xem thực đơn VIP…"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button className="iconbtn" title="Emoji" type="button">
                                <i className="far fa-smile" />
                            </button>
                        </div>
                        <button
                            className="inputbtn"
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            title="Gửi"
                        >
                            <IoMdSend size={20} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
