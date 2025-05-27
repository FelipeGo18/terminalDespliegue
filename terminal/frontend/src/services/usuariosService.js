import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com/api';

// Obtener todos los usuarios
export const getUsuarios = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/usuarios`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Crear un nuevo usuario
export const createUsuario = async (usuario) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios`, usuario);
    return response.data;
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    throw error;
  }
};

// Actualizar un usuario
export const updateUsuario = async (id, usuario) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/usuarios/${id}`, usuario);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    throw error;
  }
};

// Eliminar un usuario
export const deleteUsuario = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/usuarios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    throw error;
  }
};

// Iniciar sesión
export const loginUsuario = async (email, contraseña) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios/login`, { email, contraseña });
    return response.data;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
};

// Registrar un nuevo usuario
export const registerUsuario = async (usuario) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/usuarios`, usuario);
    return response.data;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
};