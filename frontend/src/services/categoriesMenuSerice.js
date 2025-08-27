import axios from "./axios";
export const getAllCategoriesMenu = async () => {
  try {
    const response = await axios.get("category_menus");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getCategoryMenuById = async (id) => {
  try {
    const response = await axios.get(`category_menus/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const createCategoryMenu = async (categoryData) => {
  try {
    const response = await axios.post("category_menus", categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const updateCategoryMenu = async (id, categoryData) => {
  try {
    const response = await axios.put(`category_menus/${id}`, categoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const deleteCategoryMenu = async (id) => {
  try {
    return await axios.delete(`category_menus/${id}`);
  } catch (error) {
    throw error;
  }
};
