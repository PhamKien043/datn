import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
    getBlogById,
    updateBlog,
    checkBlogTitle,
} from "../../../services/blogAdmin";
import "react-toastify/dist/ReactToastify.css";
import "./edit.css";

function EditBlog() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState({
        id: "",
        title: "",
        content: "",
        status: 1,
        image: "",
        image_url: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [checkingTitle, setCheckingTitle] = useState(false);
    const [titleValid, setTitleValid] = useState(null);

    // ✅ Hàm loại bỏ HTML trong nội dung
    function stripHtml(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent || div.innerText || "";
    }

    // ✅ Xử lý thay đổi nội dung quill
    function handleChangeContent(value) {
        setForm((prev) => ({
            ...prev,
            content: value,
        }));

        if (errors.content) {
            setErrors((prev) => ({ ...prev, content: "" }));
        }
    }

    // ✅ Load blog từ API
    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const blog = await getBlogById(id);
                setForm({
                    id: blog.id,
                    title: blog.title || "",
                    content: blog.content || "",
                    status: blog.status !== undefined ? !!blog.status : true,
                    image: blog.image || "",
                    image_url: blog.image_url || "",
                });
            } catch (err) {
                console.error("Lỗi khi load blog:", err);
                toast.error("❌ Không thể tải dữ liệu bài viết");
                navigate("/admin/blogs");
            }
        };
        fetchBlog();
    }, [id, navigate]);

    // ✅ Check trùng tiêu đề
    const checkTitleAvailability = useCallback(
        async (title) => {
            if (!title.trim()) {
                setTitleValid(null);
                setErrors((prev) => ({ ...prev, title: "" }));
                return false;
            }
            setCheckingTitle(true);
            try {
                const exists = await checkBlogTitle(title.trim(), form.id);
                if (exists) {
                    setTitleValid(false);
                    setErrors((prev) => ({
                        ...prev,
                        title: "Tiêu đề bài viết đã tồn tại",
                    }));
                } else {
                    setTitleValid(true);
                    setErrors((prev) => ({ ...prev, title: "" }));
                }
                return !exists;
            } catch (err) {
                setErrors((prev) => ({
                    ...prev,
                    title: "Không thể kiểm tra tiêu đề blog",
                }));
                setTitleValid(false);
                return false;
            } finally {
                setCheckingTitle(false);
            }
        },
        [form.id]
    );

    // debounce check tiêu đề
    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.title.trim()) {
                checkTitleAvailability(form.title);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.title, checkTitleAvailability]);

    // ✅ Xử lý chọn ảnh
    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                image: "Chỉ chấp nhận ảnh JPG, PNG hoặc GIF",
            }));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                image: "Ảnh không vượt quá 2MB",
            }));
            return;
        }
        setErrors((prev) => ({ ...prev, image: "" }));
        setImageFile(file);
    }

    // ✅ Xử lý input thay đổi
    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        if (name === "title") setTitleValid(null);
    }

    // ✅ Validate form
    function validateForm(data) {
        const tempErrors = {};
        const titleRegex = /^[a-zA-Z0-9À-ỹ\s.,!?()'"-]+$/;

        // Validate tiêu đề
        if (!data.title.trim()) {
            tempErrors.title = "Vui lòng nhập tiêu đề bài viết";
        } else if (data.title.trim().length < 5) {
            tempErrors.title = "Tiêu đề quá ngắn (tối thiểu 5 ký tự)";
        } else if (data.title.trim().length > 255) {
            tempErrors.title = "Tiêu đề quá dài (tối đa 255 ký tự)";
        } else if (!titleRegex.test(data.title)) {
            tempErrors.title = "Tiêu đề chứa ký tự không hợp lệ";
        }

        // ✅ Validate nội dung
        const plainText = stripHtml(data.content).trim();
        if (!plainText) {
            tempErrors.content = "Vui lòng nhập nội dung bài viết";
        } else if (plainText.length < 20) {
            tempErrors.content = "Nội dung quá ngắn (tối thiểu 20 ký tự)";
        }

        return tempErrors;
    }

    // ✅ Submit update
    const handleSubmit = async (e) => {
        e.preventDefault();

        const isTitleValid = await checkTitleAvailability(form.title);
        if (!isTitleValid) return;

        const validationErrors = validateForm(form);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("content", form.content);
            formData.append("status", form.status ? "1" : "0");

            if (imageFile) {
                formData.append("image", imageFile);
            }

            await updateBlog(form.id, formData);

            toast.success(`✏️ Bài viết "${form.title}" đã được cập nhật!`);
            navigate("/admin/blogs");
        } catch (err) {
            console.error(err);
            toast.error("❌ Cập nhật thất bại. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-blog-container">
            <div className="edit-blog-header">
                <h2>✏️ Chỉnh sửa bài viết</h2>
                <button
                    className="btn-back"
                    onClick={() => navigate("/admin/blogs")}
                >
                    ← Quay lại
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="add-blog-form two-columns"
                noValidate
            >
                {/* Cột 1: Tiêu đề + Trạng thái */}
                <div className="form-column">
                    <div className="form-group">
                        <label htmlFor="title">
                            Tiêu đề <span className="required">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Nhập tiêu đề bài viết"
                            className={errors.title ? "error-input" : ""}
                        />

                        <div className="validation-message">
                            {checkingTitle ? (
                                <span className="checking">
                                    <span className="spinner-small"></span> Đang kiểm tra...
                                </span>
                            ) : errors.title ? (
                                <span className="error">⚠️ {errors.title}</span>
                            ) : titleValid === true && form.title.trim() ? (
                                <span className="success">✓ Tên hợp lệ</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Trạng thái</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status.toString()}
                            onChange={handleChange}
                        >
                            <option value="1">Hoạt động</option>
                            <option value="0">Ẩn</option>
                        </select>
                    </div>
                </div>

                {/* Cột 2: Ảnh blog */}
                <div className="form-column">
                    <div className="form-group">
                        <label htmlFor="image">Ảnh blog</label>
                        <div className="image-upload">
                            <label htmlFor="image" className="upload-btn">
                                {imageFile ? "Thay đổi ảnh" : "Chọn ảnh"}
                            </label>
                            <input
                                id="image"
                                type="file"
                                accept="image/jpeg, image/png, image/gif"
                                onChange={handleImageChange}
                            />
                            {imageFile && (
                                <span className="file-name">📄 {imageFile.name}</span>
                            )}
                            {errors.image && (
                                <span className="error-message">⚠️ {errors.image}</span>
                            )}
                        </div>
                        <div className="image-preview">
                            {imageFile ? (
                                <img
                                    src={URL.createObjectURL(imageFile)}
                                    alt="Preview"
                                />
                            ) : form.image_url ? (
                                <img src={form.image_url} alt="Old" />
                            ) : null}
                        </div>
                        <div className="image-note">
                            (Định dạng: JPG, PNG, GIF - Tối đa 2MB)
                        </div>
                    </div>
                </div>

                {/* Full width: Nội dung */}
                <div className="form-group full-width">
                    <label htmlFor="content">
                        Nội dung <span className="required">*</span>
                    </label>
                    <ReactQuill
                        theme="snow"
                        value={form.content}
                        onChange={handleChangeContent}
                        placeholder="Nhập nội dung blog (tối thiểu 20 ký tự)"
                        modules={{
                            toolbar: [
                                ["bold", "italic", "underline", "strike"], // in đậm, nghiêng, gạch chân
                                [{ color: [] }, { background: [] }],       // 👈 thêm đổi màu chữ & màu nền
                                [{ list: "ordered" }, { list: "bullet" }], // danh sách
                                ["link", "image"],                         // chèn link, ảnh
                                [{ align: [] }],                           // căn chỉnh
                                ["clean"],                                 // xóa định dạng
                            ],
                        }}
                        style={{ width: "100%" }}
                    />
                </div>
                {errors.content && (
                    <span className="error-message">⚠️ {errors.content}</span>
                )}

                {/* Full width: Nút submit */}
                <div className="form-actions full-width">
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading || checkingTitle || titleValid === false}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span> Đang cập nhật...
                            </>
                        ) : (
                            "Sửa bài viết"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditBlog;
