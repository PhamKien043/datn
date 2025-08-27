import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createService } from "../../../services/serviceService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../../../services/axios";

const AddService = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    image: null,
    description: "",
    status: true,
    category_service_id: "",
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/category-services");
        setCategories(res.data);
      } catch (err) {
        toast.error("Không thể tải danh mục", err);
      }
    };
    fetchCategories();
  }, []);

  // Tạo preview ảnh khi chọn ảnh mới
  useEffect(() => {
    if (form.image) {
      const url = URL.createObjectURL(form.image);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [form.image]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;

    if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category_service_id) {
      toast.error("Vui lòng chọn danh mục dịch vụ!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();

      for (let key in form) {
        if (form[key] !== null && form[key] !== "") {
          if (key === "status") {
            formData.append(key, form[key] ? "1" : "0");
          } else {
            formData.append(key, form[key]);
          }
        }
      }

      await createService(formData);
      toast.success("Thêm dịch vụ thành công!");

      // Reset form sau khi thêm
      setForm({
        name: "",
        image: null,
        description: "",
        status: true,
        category_service_id: "",
      });
      setPreviewUrl(null);

      setTimeout(() => navigate("/admin/services"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors)
          .flat()
          .forEach((msg) => toast.error(msg));
      } else {
        toast.error("Thêm dịch vụ thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Thêm Dịch Vụ</h3>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label className="form-label">Tên dịch vụ</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ảnh dịch vụ</label>
          <input
            type="file"
            name="image"
            className="form-control"
            accept="image/*"
            onChange={handleChange}
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: "200px", marginTop: "10px" }}
            />
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Mô tả</label>
          <textarea
            name="description"
            className="form-control"
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
        </div>

        

        <div className="mb-3">
          <label className="form-label">Danh mục</label>
          <select
            name="category_service_id"
            className="form-select"
            value={form.category_service_id}
            onChange={handleChange}
            
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-check mb-3">
          <input
            type="checkbox"
            name="status"
            className="form-check-input"
            id="status"
            checked={form.status}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="status">
            Hiển thị
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Đang thêm..." : "Thêm dịch vụ"}
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default AddService;
