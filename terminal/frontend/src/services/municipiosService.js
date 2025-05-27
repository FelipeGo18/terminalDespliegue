import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com';

// Obtener todos los municipios
export const getMunicipios = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/municipios`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener municipios:', error);
    throw error;
  }
};

// Crear un nuevo municipio
export const createMunicipio = async (municipio) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/municipios`, municipio);
    return response.data;
  } catch (error) {
    console.error('Error al crear el municipio:', error);
    throw error;
  }
};

// Actualizar un municipio
export const updateMunicipio = async (id, municipio) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/municipios/${id}`, municipio);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el municipio:', error);
    throw error;
  }
};

// Eliminar un municipio
export const deleteMunicipio = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/municipios/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el municipio:', error);
    throw error;
  }
};