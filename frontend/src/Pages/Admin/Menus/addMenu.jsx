import React, { useState, useEffect, useCallback } from "react";
import { createMenu, checkMenuName } from "../../../services/menuAdmin";
import { getCategoryMenuListOnly } from "../../../services/categoryMenuAdmin";
import { useNavigate } from "react-router-dom";
import "./add.css";

function AddMenu() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    status: true,
    type: "",
    is_chay: false,
    category_id: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameValid, setNameValid] = useState(null); // null: chưa check, true: hợp lệ, false: trùng

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await getCategoryMenuListOnly();
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setCategories(data);
    } catch (err) {
      console.error("Lỗi khi load category", err);
      setCategories([]);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "name") {
      setNameValid(null); // reset trạng thái check tên khi user sửa
    }
  }

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

  const checkNameAvailability = useCallback(async (name) => {
    if (!name.trim()) {
      setNameValid(null);
      setErrors((prev) => ({ ...prev, name: "" }));
      return false;
    }
    setCheckingName(true);
    try {
      // **Gọi API GET /admin/menus/check-name**
      const exists = await checkMenuName(name.trim());
      if (exists) {
        setNameValid(false);
        setErrors((prev) => ({
          ...prev,
          name: "Tên menu đã tồn tại",
        }));
      } else {
        setNameValid(true);
        setErrors((prev) => ({ ...prev, name: "" }));
      }
      return !exists;
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        name: "Không thể kiểm tra tên menu. Vui lòng thử lại",
      }));
      setNameValid(false);
      return false;
    } finally {
      setCheckingName(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.name.trim()) {
        checkNameAvailability(form.name);
      } else {
        setNameValid(null);
        setErrors((prev) => ({ ...prev, name: "" }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.name, checkNameAvailability]);

  function validateForm(data, isNameValid) {
    const tempErrors = {};
    const nameRegex = /^[a-zA-Z0-9À-ỹ\s]+$/;

    if (!data.name.trim()) {
      tempErrors.name = "Vui lòng nhập tên menu";
    } else if (data.name.trim().length < 3) {
      tempErrors.name = "Tên menu quá ngắn (tối thiểu 3 ký tự)";
    } else if (data.name.trim().length > 255) {
      tempErrors.name = "Tên menu quá dài (tối đa 255 ký tự)";
    } else if (!nameRegex.test(data.name)) {
      tempErrors.name = "Tên menu không được chứa ký tự đặc biệt";
    } else if (isNameValid === false) {
      tempErrors.name = "Tên menu đã tồn tại";
    }

    if (!data.price.toString().trim()) {
      tempErrors.price = "Vui lòng nhập giá";
    } else {
      const priceNum = Number(data.price);
      if (isNaN(priceNum) || priceNum < 0) {
        tempErrors.price = "Giá phải là số dương";
      } else if (priceNum > 10000000) {
        tempErrors.price = "Giá không được vượt quá 10,000,000 VND";
      }
    }

    if (!data.type.trim()) {
      tempErrors.type = "Vui lòng chọn loại menu";
    }

    if (!data.category_id) {
      tempErrors.category_id = "Vui lòng chọn danh mục";
    }

    return tempErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const isNameValid = await checkNameAvailability(form.name);
    const validationErrors = validateForm(form, isNameValid);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(
          key,
          typeof form[key] === "boolean" ? (form[key] ? 1 : 0) : form[key]
        );
      }
      if (imageFile) formData.append("image", imageFile);

      await createMenu(formData);
      alert("Thêm menu thành công!");
      navigate("/admin/menus");
    } catch (error) {
      alert(error.message || "Có lỗi xảy ra khi thêm menu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-menu-container">
      <div className="add-menu-header">
        <h2>➕ Thêm Menu Mới</h2>
        <button className="btn-back" onClick={() => navigate("/admin/menus")}>
          ← Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-menu-form" noValidate>
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">
              Tên menu <span className="required">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? "error-input" : ""}
              placeholder="Nhập tên menu (3-255 ký tự)"
              maxLength={255}
            />
            <div className="validation-message">
              {checkingName ? (
                <span className="checking">
                  <span className="spinner-small"></span> Đang kiểm tra...
                </span>
              ) : errors.name ? (
                <span className="error">
                  <i className="icon-error">⚠️</i> {errors.name}
                </span>
              ) : nameValid === true && form.name.trim() ? (
                <span className="success">
                  <i className="icon-success">✓</i> Tên hợp lệ
                </span>
              ) : null}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả về menu (tối đa 500 ký tự)"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">
              Giá (VND) <span className="required">*</span>
            </label>
            <input
              id="price"
              type="number"
              min="0"
              step="1000"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={errors.price ? "error-input" : ""}
              placeholder="Nhập giá (0 - 10,000,000 VND)"
            />
            {errors.price && (
              <span className="error-message">
                <i className="icon-error">⚠️</i> {errors.price}
              </span>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="type">
              Loại menu <span className="required">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              className={errors.type ? "error-input" : ""}
            >
              <option value="">-- Chọn loại --</option>
              <option value="combo">Combo</option>
              <option value="single">Món đơn</option>
              <option value="drink">Đồ uống</option>
              <option value="appetizer">Khai vị</option>
            </select>
            {errors.type && (
              <span className="error-message">
                <i className="icon-error">⚠️</i> {errors.type}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category_id">
              Danh mục <span className="required">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className={errors.category_id ? "error-input" : ""}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <span className="error-message">
                <i className="icon-error">⚠️</i> {errors.category_id}
              </span>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="status"
                checked={form.status}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              <span>Hoạt động</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_chay"
                checked={form.is_chay}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              <span>Món chay</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="image">Ảnh menu</label>
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
                <span className="file-name">
                  <i className="icon-file">📄</i> {imageFile.name}
                </span>
              )}
              {errors.image && (
                <span className="error-message">
                  <i className="icon-error">⚠️</i> {errors.image}
                </span>
              )}
            </div>
            <div className="image-note">(Định dạng: JPG, PNG, GIF - Tối đa 2MB)</div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || checkingName || nameValid === false}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Đang thêm...
              </>
            ) : (
              "Thêm Menu"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMenu;
