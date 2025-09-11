import React, { useEffect, useState, useCallback } from "react";
import { getMenuById, updateMenu, checkMenuName } from "../../../services/menuAdmin";
import { getCategoryMenuListOnly } from "../../../services/categoryMenuAdmin";
import { useParams, useNavigate } from "react-router-dom";
import "./edit.css";

function EditMenu() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    status: true,
    type: "null",
    is_chay: false,
    category_id: "",
    image: null, // ảnh mới
  });
  const [oldImage, setOldImage] = useState(null); // ảnh cũ từ server
  const [preview, setPreview] = useState(null); // preview ảnh mới
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [checkingName, setCheckingName] = useState(false);
  const [nameValid, setNameValid] = useState(null);

 const API_URL = "http://localhost:8000";

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, [id]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const data = await getMenuById(id);
      setForm({
        name: data.name || "",
        description: data.description || "",
        price: data.price || "",
        status: data.status !== undefined ? !!data.status : true,
        type: data.type || "",
        is_chay: data.is_chay !== undefined ? !!data.is_chay : false,
        category_id: data.category_id ? String(data.category_id) : "",
        image: null,
      });
      setOldImage(data.image 
        ? `${API_URL}/storage/menus/${data.image}`
          : "https://via.placeholder.com/150x100?text=Không+có+ảnh"
      );
      setNameValid(true);
      setErrors({});
    } catch (error) {
      alert("Lỗi khi lấy dữ liệu menu.");
      navigate("/admin/menus");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategoryMenuListOnly();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setCategories(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục:", error);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      if (file) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "name") setNameValid(null);
    else if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const checkNameAvailability = useCallback(
    async (name) => {
      if (!name.trim()) {
        setNameValid(null);
        return false;
      }
      setCheckingName(true);
      try {
        const exists = await checkMenuName(name.trim(), id);
        setNameValid(!exists);
        if (exists) setErrors((prev) => ({ ...prev, name: "Tên menu đã tồn tại" }));
        else setErrors((prev) => ({ ...prev, name: "" }));
        return !exists;
      } catch (error) {
        setErrors((prev) => ({ ...prev, name: "Không thể kiểm tra tên menu" }));
        setNameValid(false);
        return false;
      } finally {
        setCheckingName(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.name.trim()) checkNameAvailability(form.name);
      else setNameValid(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.name, checkNameAvailability]);

  function validateForm(data, isNameValid) {
    const tempErrors = {};
    const nameRegex = /^[a-zA-Z0-9À-ỹ\s]+$/;

    if (!data.name.trim()) tempErrors.name = "Vui lòng nhập tên menu";
    else if (data.name.trim().length < 3) tempErrors.name = "Tên menu quá ngắn (tối thiểu 3 ký tự)";
    else if (data.name.trim().length > 255) tempErrors.name = "Tên menu quá dài (tối đa 255 ký tự)";
    else if (!nameRegex.test(data.name)) tempErrors.name = "Tên menu không được chứa ký tự đặc biệt";
    else if (isNameValid === false) tempErrors.name = "Tên menu đã tồn tại";

    if (!data.price.toString().trim()) tempErrors.price = "Vui lòng nhập giá";
    else {
      const priceNum = Number(data.price);
      if (isNaN(priceNum) || priceNum < 0) tempErrors.price = "Giá phải là số dương";
      else if (priceNum > 10000000) tempErrors.price = "Giá không được vượt quá 10,000,000 VND";
    }

    if (!data.type.trim()) tempErrors.type = "Vui lòng chọn loại menu";
    if (!data.category_id) tempErrors.category_id = "Vui lòng chọn danh mục";

    return tempErrors;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isNameValid = await checkNameAvailability(form.name);
    const validationErrors = validateForm(form, isNameValid);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      for (const key of ["name", "description", "price", "status", "type", "is_chay", "category_id"]) {
        let value = form[key];
        if (typeof value === "boolean") value = value ? 1 : 0;
        if (key === "category_id") value = Number(value);
        formData.append(key, value);
      }

      if (form.image) {
        formData.append("image", form.image);
      }

      formData.append("_method", "PUT");
      await updateMenu(id, formData);
      alert("Cập nhật menu thành công!");
      navigate("/admin/menus");
    } catch (error) {
      alert(error.message || "Lỗi khi cập nhật menu");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.name) return <div className="loading-container">Đang tải dữ liệu...</div>;

  return (
    <div className="edit-menu-container">
      <div className="edit-menu-header">
        <h2>📝 Chỉnh sửa Menu</h2>
        <button className="btn-back" onClick={() => navigate("/admin/menus")}>← Quay lại</button>
      </div>

      <form onSubmit={handleSubmit} className="edit-menu-form" noValidate>
        <div className="form-grid">
          <div className="form-column">
            <div className="form-group">
              <label htmlFor="name">Tên menu <span className="required">*</span></label>
              <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Nhập tên menu" className={errors.name ? "error-input" : ""} />
              {errors.name && <span className="error-message">⚠️ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="Mô tả về menu" rows="4" />
            </div>

            <div className="form-group">
              <label htmlFor="price">Giá <span className="required">*</span></label>
              <input type="number" id="price" name="price" min="0" value={form.price} onChange={handleChange} placeholder="Nhập giá" className={errors.price ? "error-input" : ""} />
              {errors.price && <span className="error-message">⚠️ {errors.price}</span>}
            </div>
{/* 
            <div className="form-group">
              <label htmlFor="type">Loại menu <span className="required">*</span></label>
              <select id="type" name="type" value={form.type} onChange={handleChange} className={errors.type ? "error-input" : ""}>
                <option value="">Chọn loại menu</option>
                <option value="combo">Combo</option>
                <option value="single">Món đơn</option>
                <option value="drink">Đồ uống</option>
              </select>
              {errors.type && <span className="error-message">⚠️ {errors.type}</span>}
            </div> */}

         

          <div className="form-column">
            <div className="form-group">
              <label htmlFor="category_id">Danh mục <span className="required">*</span></label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} className={errors.category_id ? "error-input" : ""}>
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              {errors.category_id && <span className="error-message">⚠️ {errors.category_id}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="status" checked={form.status} onChange={handleChange} />
                <span className="checkmark"></span>
                <span className="checkbox-label">Hoạt động</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="is_chay" checked={form.is_chay} onChange={handleChange} />
                <span className="checkmark"></span>
                <span className="checkbox-label">Món chay</span>
              </label>
            </div>
          </div>
        </div> 
          <div className="form-group">
              <label htmlFor="image">Ảnh menu</label>
              <input type="file" id="image" name="image" accept="image/*" onChange={handleChange} />
              {oldImage && !preview && (
                <div className="image-preview">
                  <p>Ảnh hiện tại:</p>
                  <img src={oldImage} alt="Menu hiện tại" height="100" />
                </div>
              )}
              {preview && (
                <div className="image-preview">
                  <p>Ảnh mới:</p>
                  <img src={preview} alt="Xem trước ảnh" height="100" />
                </div>
              )}
            </div>
          </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading || checkingName || nameValid === false}>
            {loading ? <><span className="spinner"></span> Đang lưu...</> : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditMenu;
