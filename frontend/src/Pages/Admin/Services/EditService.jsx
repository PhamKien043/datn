import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getServiceById, updateService } from "../../../services/serviceService";
import axios from "../../../services/axios";
import { toast } from "react-toastify";

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
    category_service_id: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getServiceById(id);
        const data = res.data;
        setForm({
          name: data.name,
          description: data.description || "",
          status: !!data.status,
          category_service_id: data.category_service_id || "",
          image: null,
        });
        if (data.image_url) {
          setPreview(data.image_url);
        }
      } catch (error) {
        toast.error("Không lấy được dữ liệu dịch vụ", error);
      }
    };

    fetchData();
  }, [id]);

  // Lấy danh mục dịch vụ
  useEffect(() => {
    axios.get("/category-services").then((res) => setCategories(res.data));
  }, []);

  // Xử lý xem trước ảnh
  useEffect(() => {
    if (form.image) {
      const url = URL.createObjectURL(form.image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [form.image]);

  const handleChange = (e) => {
    const { name, type, value, checked, files } = e.target;
    if (type === "file") {
      setForm({ ...form, image: files[0] });
    } else if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    for (let key in form) {
      if (form[key] !== null && form[key] !== "") {
        if (key === "status") {
          formData.append(key, form[key] ? 1 : 0);
        } else {
          formData.append(key, form[key]);
        }
      }
    }

    try {
      await updateService(id, formData);
      toast.success("Cập nhật thành công");
      navigate("/admin/services");
    } catch (error) {
      toast.error("Cập nhật thất bại", error);
    }
  };

  return (
    <div className="container mt-4">
      <h4>Cập nhật dịch vụ</h4>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          className="form-control mb-2"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Tên dịch vụ"
          required
        />
        <textarea
          className="form-control mb-2"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Mô tả"
        />
        <select
          className="form-select mb-2"
          name="category_service_id"
          value={form.category_service_id}
          onChange={handleChange}
          required
        >
          <option value="">-- Chọn danh mục --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          className="form-control mb-2"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "150px", marginTop: "10px" }}
          />
        )}
        <div className="form-check my-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="status"
            name="status"
            checked={form.status}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="status">
            Hiển thị
          </label>
        </div>
        <button className="btn btn-success" type="submit">
          Cập nhật
        </button>
      </form>
    </div>
  );
};

export default EditService;
