import QRCode from 'qrcode';
import { createTicket } from './tiquetesService';
import Swal from "sweetalert2"; // <-- Agrega SweetAlert

// canvasElementId: id del canvas donde se pintará el QR
export const buyTicketAndShowQRCode = async (ticketData, canvasElementId) => {
  try {
    const newTicket = await createTicket(ticketData);

    const qrContent = `Ticket ID: ${newTicket.id}\nNombre: ${newTicket.nombre}\nFecha: ${newTicket.fecha}`;

    await QRCode.toCanvas(document.getElementById(canvasElementId), qrContent);

    Swal.fire({
      icon: 'success',
      title: '¡Ticket comprado!',
      text: 'El ticket fue creado y el QR generado correctamente.',
    });
  } catch (error) {
    console.error('Error al generar el QR:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo generar el ticket.',
    });
  }
};
