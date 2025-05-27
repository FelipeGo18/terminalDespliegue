import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com';

// Obtener todos los roles
export const getRoles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw error;
  }
};

// Crear un nuevo rol
export const createRol = async (rol) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/roles`, rol);
    return response.data;
  } catch (error) {
    console.error('Error al crear el rol:', error);
    throw error;
  }
};

// Actualizar un rol
export const updateRol = async (id, rol) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/roles/${id}`, rol);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el rol:', error);
    throw error;
  }
};

// Eliminar un rol
export const deleteRol = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el rol:', error);
    throw error;
  }
};