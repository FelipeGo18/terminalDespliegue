import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com/api';

// Obtener todas las rutas
export const getRutas = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rutas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener rutas:', error.response?.data || error.message);
    throw error;
  }
};

// Crear una nueva ruta
export const createRuta = async (ruta) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/rutas`, ruta);
    return response.data;
  } catch (error) {
    console.error('Error al crear la ruta:', error);
    throw error;
  }
};

// Actualizar una ruta
export const updateRuta = async (id, ruta) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/rutas/${id}`, ruta);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar la ruta:', error);
    throw error;
  }
};

// Eliminar una ruta
export const deleteRuta = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/rutas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar la ruta:', error);
    throw error;
  }
};

// Obtener rutas de una empresa específica
export const getRutasPorEmpresa = async (empresaId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/rutas/empresa/${empresaId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener rutas por empresa:', error);
    throw error;
  }
};

// Obtener todas las empresas
export const getEmpresas = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/empresas`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    throw error;
  }
};

// Crear una nueva empresa
export const createEmpresa = async (empresa) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/empresas`, empresa);
    return response.data;
  } catch (error) {
    console.error('Error al crear la empresa:', error);
    throw error;
  }
};

// Actualizar una empresa
export const updateEmpresa = async (id, empresa) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/empresas/${id}`, empresa);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar la empresa:', error);
    throw error;
  }
};

// Eliminar una empresa
export const deleteEmpresa = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/empresas/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar la empresa:', error);
    throw error;
  }
};