import axios from 'axios';

const API_BASE_URL = 'http://localhost:4004/api';

// Obtener todos los buses
export const getBuses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/buses`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener buses:', error);
    throw error;
  }
};

// Crear un nuevo bus
export const createBus = async (bus) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/buses`, bus);
    return response.data;
  } catch (error) {
    console.error('Error al crear el bus:', error);
    throw error;
  }
};

// Actualizar un bus
export const updateBus = async (id, bus) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/buses/${id}`, bus);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el bus:', error);
    throw error;
  }
};

// Eliminar un bus
export const deleteBus = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/buses/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el bus:', error);
    throw error;
  }
};

// Obtener los buses por ruta
export const getBusesPorRuta = async (rutaId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/buses/ruta/${rutaId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los buses por ruta:', error);
    throw error;
  }
};

// Obtener buses según origen y destino
export const getBusesPorOrigenDestino = async (origen, destino) => {
  try {
    console.log(`Enviando solicitud al backend con origen: "${origen}" y destino: "${destino}"`); // Log para depuración
    const response = await axios.get(`${API_BASE_URL}/buses/origen-destino`, {
      params: { origen, destino }
    });
    console.log('Respuesta del backend:', response.data); // Log para depuración
    return response.data;
  } catch (error) {
    console.error('Error al obtener los buses por origen y destino:', error.response?.data || error.message);
    throw error;
  }
};