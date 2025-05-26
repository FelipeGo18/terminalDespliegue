import axios from 'axios';

const ADMIN_PANEL_API_URL = 'http://localhost:5000/api';

export const getBusesFromAdminPanel = async () => {
  const response = await axios.get(`${ADMIN_PANEL_API_URL}/buses`);
  return response.data;
};

export const deleteBusFromAdminPanel = async (id) => {
  const response = await axios.delete(`${ADMIN_PANEL_API_URL}/buses/${id}`);
  return response.data;
};

// Agrega más funciones según sea necesario
