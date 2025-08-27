import instance from "./axios";

export const getAllLocationTypes = async () => {
    try {
        const response = await instance.get("admin/location-types");
        return response.data;
    } catch (error) {
        console.error("Error fetching location types:", error);
        throw error;
    }
};

export const getLocationTypeById = async (id) => {
    try {
        const response = await instance.get(`admin/location-types/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching location type with ID ${id}:`, error);
        throw error;
    }
};

export const createLocationType = async (formData) => {
    try {
        const response = await instance.post("admin/location-types", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error adding location type:", error.response?.data || error.message);
        throw error;
    }
};

export const updateLocationType = async (id, formData) => {
    try {
        const response = await instance.post(`admin/location-types/${id}?_method=PUT`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating location type with ID ${id}:`, error.response?.data || error.message);
        throw error;
    }
};

export const deleteLocationType = async (id) => {
    try {
        const response = await instance.delete(`admin/location-types/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting location type with ID ${id}:`, error);
        throw error;
    }
};

export const checkLocationTypeName = async (name, id = null) => {
    try {
        const response = await instance.post("admin/location-types/check-name", { name, id });
        return response.data.exists;
    } catch (error) {
        console.error("Error checking location type name:", error);
        throw error;
    }
};