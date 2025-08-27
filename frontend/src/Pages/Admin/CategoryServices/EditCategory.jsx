
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCategoryById,
  updateCategory,
} from "../../../services/categoryServices";
import { toast } from "react-toastify";

const EditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: 1,
  });

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const data = await getCategoryById(id);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          status: data.status ?? 1,
        });
      } catch (error) {
        toast.error("Không lấy được thông tin danh mục", error);
      }
    };
    fetchCategory();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCategory(id, formData);
      toast.success("Cập nhật danh mục thành công");
      navigate("/admin/category-services");
    } catch (error) {
      toast.error("Cập nhật thất bại", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Chỉnh sửa danh mục</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Tên danh mục:</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label>Mô tả:</label>
          <textarea
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <div className="mb-3">
          <label>Trạng thái:</label>
          <select
            name="status"
            className="form-control"
            value={formData.status}
            onChange={handleChange}
          >
            <option value={1}>Hiển thị</option>
            <option value={0}>Ẩn</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
};

export default EditCategory;
