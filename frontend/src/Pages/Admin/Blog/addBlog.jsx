import React, { useState, useEffect, useCallback } from "react";
import { createBlog, checkBlogTitle } from "../../../services/blogAdmin";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./add.css";

function AddBlog() {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        title: "",
        content: "",
        status: "1",
    });

    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [checkingTitle, setCheckingTitle] = useState(false);
    const [titleValid, setTitleValid] = useState(null);

    // ✅ Loại bỏ HTML để validate content chính xác
    function stripHtml(html) {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    const checkTitleAvailability = useCallback(async (title) => {
        if (!title.trim()) {
            setTitleValid(null);
            setErrors((prev) => ({ ...prev, title: "" }));
            return false;
        }

        setCheckingTitle(true);
        try {
            const exists = await checkBlogTitle(title.trim());
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
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.title.trim()) {
                checkTitleAvailability(form.title);
            } else {
                setTitleValid(null);
                setErrors((prev) => ({ ...prev, title: "" }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [form.title, checkTitleAvailability]);

    function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setErrors((prev) => ({
                ...prev,
                image: "Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc GIF",
            }));
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                image: "Kích thước ảnh không được vượt quá 2MB",
            }));
            return;
        }

        setErrors((prev) => ({ ...prev, image: "" }));
        setImageFile(file);
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        if (name === "title") setTitleValid(null);
    }

    // 👉 Đăng ký danh sách font mình muốn cho phép
    const Font = Quill.import("formats/font");
    Font.whitelist = [
        "arial",
        "roboto",
        "noto-sans",
        "times-new-roman",
        "verdana",
        "georgia",
        "tahoma",
        "courier-new",
    ];
    Quill.register(Font, true);

    // ✅ Thay cho textarea
    function handleChangeContent(value) {
        setForm((prev) => ({
            ...prev,
            content: value,
        }));

        if (errors.content) {
            setErrors((prev) => ({ ...prev, content: "" }));
        }
    }

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

        // Validate trạng thái
        if (data.status === undefined || data.status === null || data.status === "") {
            tempErrors.status = "Vui lòng chọn trạng thái";
        } else if (!["0", "1"].includes(data.status.toString())) {
            tempErrors.status = "Trạng thái không hợp lệ";
        }

        return tempErrors;
    }


    async function handleSubmit(e) {
        e.preventDefault();

        const isTitleValid = await checkTitleAvailability(form.title);
        const validationErrors = validateForm(form, isTitleValid);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("status", parseInt(form.status));

            for (const key in form) {
                if (key !== "status") {
                    formData.append(
                        key,
                        typeof form[key] === "boolean"
                            ? form[key]
                                ? 1
                                : 0
                            : form[key]
                    );
                }
            }

            if (imageFile) {
                formData.append("image", imageFile);
            }

            await createBlog(formData);

            toast.success("🎉 Thêm bài viết thành công!");
            navigate("/admin/blogs");
        } catch (error) {
            console.error("Lỗi khi thêm bài viết:", error);

            if (error.response && error.response.status === 422) {
                const backendErrors = error.response.data.errors || {};
                setErrors((prev) => ({
                    ...prev,
                    ...Object.fromEntries(
                        Object.entries(backendErrors).map(([key, value]) => [
                            key,
                            value[0],
                        ])
                    ),
                }));

                const firstError = Object.values(backendErrors)[0];
                if (firstError && firstError.length > 0) {
                    toast.error(firstError[0]);
                } else {
                    toast.error("❌ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại form.");
                }
            } else {
                toast.error(error.message || "❌ Có lỗi xảy ra khi thêm bài viết.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="add-blog-container">
            <div className="add-blog-header">
                <h2>➕ Thêm bài viết mới</h2>
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
                {/* Tiêu đề + Trạng thái */}
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
                            onBlur={async () => {
                                if (!form.title.trim()) return;

                                setCheckingTitle(true);
                                try {
                                    const exists = await checkBlogTitle(
                                        form.title,
                                        form.id || null
                                    );
                                    setTitleValid(!exists);
                                    if (exists) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            title: "Tiêu đề đã tồn tại",
                                        }));
                                    }
                                } finally {
                                    setCheckingTitle(false);
                                }
                            }}
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

                    {/* Trạng thái */}
                    <div className="form-group">
                        <label htmlFor="status">Trạng thái</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status.toString()}
                            onChange={handleChange}
                        >
                            <option value="1">Hiển thị</option>
                            <option value="0">Ẩn</option>
                        </select>
                    </div>
                </div>

                {/* Ảnh blog */}
                <div className="form-column">
                    <div className="form-group">
                        <label htmlFor="image">Ảnh bài viết</label>

                        <div className="image-upload">
                            <label htmlFor="image" className="upload-btn">
                                {imageFile ? `📄 ${imageFile.name}` : "Chọn ảnh"}
                            </label>
                            <input
                                id="image"
                                type="file"
                                accept="image/jpeg, image/png, image/gif"
                                onChange={handleImageChange}
                                style={{ display: "none" }} // ẩn input
                            />

                            {errors.image && (
                                <span className="error-message">⚠️ {errors.image}</span>
                            )}
                        </div>

                        <div className="image-preview">
                            {imageFile ? (
                                <img
                                    src={URL.createObjectURL(imageFile)}
                                    alt="Preview"
                                    className="preview-img"
                                />
                            ) : form.image_url ? (
                                <img
                                    src={form.image_url}
                                    alt="Old"
                                    className="preview-img"
                                />
                            ) : (
                                <div className="no-image">Chưa có ảnh</div>
                            )}
                        </div>

                        <div className="image-note">(Định dạng: JPG, PNG, GIF - Tối đa 2MB)</div>
                    </div>
                </div>

                {/* Nội dung */}
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
                                [{ font: Font.whitelist }],   // ✅ load font vừa đăng ký
                                [{ size: ["small", false, "large", "huge"] }],
                                ["bold", "italic", "underline", "strike"],
                                [{ color: [] }, { background: [] }],
                                [{ list: "ordered" }, { list: "bullet" }],
                                [{ align: [] }],
                                ["link", "image", "video"],
                                ["clean"],
                            ],
                        }}
                        formats={[
                            "font",
                            "size",
                            "bold",
                            "italic",
                            "underline",
                            "strike",
                            "color",
                            "background",
                            "list",
                            "bullet",
                            "align",
                            "link",
                            "image",
                            "video",
                        ]}
                    />
                </div>
                {errors.content && (
                    <span className="error-message">⚠️ {errors.content}</span>
                )}

                {/* Nút submit */}
                <div className="form-actions full-width">
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={
                            loading || checkingTitle || titleValid === false
                        }
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span> Đang thêm...
                            </>
                        ) : (
                            "Thêm bài viết"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddBlog;
