import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com/api';

// Obtener todas las relaciones ruta-municipio
export const getRutaMunicipios = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/ruta_municipios`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener relaciones ruta-municipio:', error);
    throw error;
  }
};

// Crear una nueva relación ruta-municipio
export const createRutaMunicipio = async (rutaMunicipio) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ruta_municipios`, rutaMunicipio);
    return response.data;
  } catch (error) {
    console.error('Error al crear la relación ruta-municipio:', error);
    throw error;
  }
};

// Actualizar una relación ruta-municipio
export const updateRutaMunicipio = async (id, rutaMunicipio) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/ruta_municipios/${id}`, rutaMunicipio);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar la relación ruta-municipio:', error);
    throw error;
  }
};

// Eliminar una relación ruta-municipio
export const deleteRutaMunicipio = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/ruta_municipios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar la relación ruta-municipio:', error);
    throw error;
  }
};