import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCategory } from "../../../services/categoryServices";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddCategory = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: true,
  });

  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        ...form,
        status: form.status ? 1 : 0,
      };

      await addCategory(payload);
      toast.success("Thêm danh mục thành công!");

      setForm({
        name: "",
        description: "",
        status: true,
      });

      setTimeout(() => navigate("/admin/category-services"), 1500);
    } catch (err) {
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors)
          .flat()
          .forEach((msg) => toast.error(msg));
      } else {
        toast.error("Thêm danh mục thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-4">Thêm Danh Mục</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tên danh mục</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            required
          />
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
          {loading ? "Đang thêm..." : "Thêm danh mục"}
        </button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default AddCategory;
