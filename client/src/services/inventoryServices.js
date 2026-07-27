// src/services/inventoryServices.js
import api from "../api/axios";

// Helper utility to safely construct the configuration object matching backend middleware filters
const getAuthConfig = (token) => {
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const fetchItems = (token) => {
    return api.get("/inventory", getAuthConfig(token));
};

export const createItem = (itemData, token) => {
    return api.post("/inventory", itemData, getAuthConfig(token));
};

export const updateItem = (id, itemData, token) => {
    return api.put(`/inventory/${id}`, itemData, getAuthConfig(token));
};

export const deleteItem = (id, token) => {
    return api.delete(`/inventory/${id}`, getAuthConfig(token));
};
