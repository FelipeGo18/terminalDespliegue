import axios from 'axios';

const API_BASE_URL = 'https://terminaldespliegue.onrender.com';

// Obtener todos los tickets
export const getTickets = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/tickets`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    throw error;
  }
};

// Crear un nuevo ticket y devolver la información detallada del ticket
export const createTicket = async (ticket) => {
  try {
    console.log('Datos enviados al servidor:', ticket); // Verificar los datos enviados
    const response = await axios.post(`${API_BASE_URL}/tickets`, ticket);
    console.log('Respuesta del servidor:', response.data); // Verificar la respuesta del servidor
    return response.data;
  } catch (error) {
    console.error('Error al crear el ticket:', error);
    throw error;
  }
};

// Actualizar un ticket
export const updateTicket = async (id, ticket) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/tickets/${id}`, ticket);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el ticket:', error);
    throw error;
  }
};

// Eliminar un ticket
export const deleteTicket = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/tickets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar el ticket:', error);
    throw error;
  }
};
