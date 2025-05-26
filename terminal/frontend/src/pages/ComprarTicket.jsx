import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { createTicket } from "../services/tiquetesService"; // Servicio para crear tickets
import { useUser } from "../context/UserContext"; // Contexto de usuario para obtener datos de sesión
import { useNavigate, useLocation } from "react-router-dom"; // Hooks para navegación y estado
import { io } from "socket.io-client"; // Biblioteca para comunicación en tiempo real vía WebSocket
import Swal from "sweetalert2"; // <-- Agrega SweetAlert
import "../styles/ComprarTicket.css";

const SOCKET_URL = "http://localhost:4004"; // URL del servidor de WebSocket

const ComprarTicket = () => {
  const { user } = useUser(); // Obtiene el usuario actual desde el contexto
  const navigate = useNavigate(); // Hook para manejar navegación entre páginas
  const location = useLocation(); // Obtiene datos de la ubicación actual (estado pasado desde otra página)
  const { bus, ruta } = location.state || {}; // Extrae datos del bus y la ruta desde la navegación
  const [formData, setFormData] = useState({ asiento: "" }); // Estado para el campo de asiento
  const [qrUrl, setQrUrl] = useState(""); // Estado para almacenar la URL del QR generado
  const [ticketCreado, setTicketCreado] = useState(null); // Estado para guardar los datos del ticket una vez creado
  const [error, setError] = useState(null); // Estado para manejar errores en la compra de ticket
  const [showMap, setShowMap] = useState(false); // Estado para controlar la visualización del mapa del bus
  const [busLocation, setBusLocation] = useState(null); // Estado para la ubicación del bus en tiempo real
  const [asientosOcupados, setAsientosOcupados] = useState([]); // NUEVO: asientos ocupados
  const socketRef = useRef(null); // Referencia para la conexión WebSocket

  // Si no hay datos de bus o ruta, mostrar un mensaje de error
  if (!bus || !ruta) {
    return <p>No se proporcionaron datos para comprar el ticket.</p>;
  }

  // Obtener asientos ocupados al cargar el componente
  useEffect(() => {
    async function fetchAsientos() {
      if (bus && bus.viaje_id) {
        try {
          const res = await fetch(`http://localhost:4004/api/tickets?viaje_id=${bus.viaje_id}`);
          const data = await res.json();
          setAsientosOcupados(data.map(t => Number(t.asiento)));
        } catch {
          setAsientosOcupados([]);
        }
      }
    }
    fetchAsientos();
  }, [bus]);

  // Calcular el siguiente asiento disponible (ascendente)
  const siguienteAsiento = () => {
    const total = bus.cat_asientos || 40;
    for (let i = 1; i <= total; i++) {
      if (!asientosOcupados.includes(i)) return i;
    }
    return null;
  };

  // Manejo de cambios en el formulario (actualiza el estado cuando el usuario ingresa datos)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejo de envío del formulario al hacer clic en "Comprar"
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar si el usuario está autenticado antes de proceder con la compra
    if (!user || !user.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Debes iniciar sesión',
        text: 'Debes iniciar sesión para comprar un ticket.',
      });
      navigate("/login"); // Redirigir al login si no está autenticado
      return;
    }

    // Validación: No pedir el campo de asiento, se asigna automáticamente
    const asientoAsignado = siguienteAsiento();
    if (!asientoAsignado) {
      setError("No hay asientos disponibles.");
      return;
    }

    try {
      // Estructurar los datos para enviar al backend
      const ticketData = {
        usuario_id: user.id,
        viaje_id: bus.viaje_id,
        asiento: asientoAsignado, // Asignar automáticamente
      };

      // Llamada al servicio para crear el ticket en el backend
      const response = await createTicket(ticketData);

      // Guardar el ticket en el estado
      setTicketCreado(response);

      // Generar un código QR con los datos del ticket
      const qrData = JSON.stringify(response);
      const qr = await QRCode.toDataURL(qrData);
      setQrUrl(qr);

      Swal.fire({
        icon: 'success',
        title: '¡Ticket comprado!',
        text: 'El ticket fue creado y el QR generado correctamente.',
      });

      // Si el bus tiene ID, obtener su ubicación y enviarla al backend por WebSocket
      if (bus.bus_id) {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              // Inicializar conexión WebSocket si no existe
              if (!socketRef.current) {
                socketRef.current = io(SOCKET_URL);
              }
              // Enviar la ubicación al backend
              socketRef.current.emit("updateBusLocation", {
                busId: bus.bus_id,
                lat: latitude,
                lng: longitude,
              });
            },
            (err) => {
              console.error("No se pudo obtener la ubicación:", err);
            }
          );
        } else {
          console.error("Geolocalización no soportada");
        }
      }
    } catch (error) {
      setError("Error al crear el ticket. Verifica los datos.");
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el ticket.',
      });
      console.error(error);
    }
  };

  // Efecto secundario: cuando se crea un ticket, suscribirse a la ubicación del bus en tiempo real
  useEffect(() => {
    if (ticketCreado && bus && bus.bus_id) {
      setShowMap(true); // Activar mapa de ubicación del bus
      socketRef.current = io(SOCKET_URL); // Conectar al servidor WebSocket
      socketRef.current.emit("joinBus", bus.bus_id); // Unirse al canal del bus
      socketRef.current.on("busLocation", (data) => {
        // Actualizar la ubicación del bus en el estado
        setBusLocation({
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp,
        });
      });

      // Cleanup: al salir de la página, eliminar la suscripción al bus
      return () => {
        socketRef.current?.emit("leaveBus", bus.bus_id);
        socketRef.current?.disconnect();
      };
    }
  }, [ticketCreado, bus]);

  return (
    <div className="ticket-container">
      <h2 className="ticket-title">Comprar Ticket</h2>
      <p className="ticket-info">
        <strong>Ruta:</strong> {ruta.origen} → {ruta.destino}
      </p>
      <p className="ticket-info">
        <strong>Bus:</strong> {bus.numero_bus}
      </p>
      <p className="ticket-info">
        <strong>Conductor:</strong> {bus.conductor}
      </p>
      <p className="ticket-info">
        <strong>Salida:</strong> {new Date(bus.salida).toLocaleString()}
      </p>
      <p className="ticket-info">
        <strong>Llegada:</strong> {new Date(bus.llegada).toLocaleString()}
      </p>

      <form onSubmit={handleSubmit} className="ticket-form">
        {/* Eliminar input manual de asiento */}
        <div style={{ marginBottom: 10 }}>
          <strong>
            Asiento asignado automáticamente:{" "}
            {siguienteAsiento() ? siguienteAsiento() : "No disponible"}
          </strong>
        </div>
        <button type="submit" className="ticket-button" disabled={!siguienteAsiento()}>
          Comprar
        </button>
      </form>

      {error && <p className="ticket-error">{error}</p>}

      {ticketCreado && (
        <div className="ticket-details">
          <h3 className="ticket-subtitle">🎫 Detalles del Ticket</h3>
          <p className="ticket-info">
            <strong>Origen:</strong> {ticketCreado.origen}
          </p>
          <p className="ticket-info">
            <strong>Destino:</strong> {ticketCreado.destino}
          </p>
          <p className="ticket-info">
            <strong>Bus:</strong> {ticketCreado.numero_bus}
          </p>
          <p className="ticket-info">
            <strong>Conductor:</strong> {ticketCreado.conductor}
          </p>
          <p className="ticket-info">
            <strong>Asiento:</strong> {ticketCreado.asiento}
          </p>
          <p className="ticket-info">
            <strong>Hora de salida:</strong>{" "}
            {new Date(ticketCreado.salida).toLocaleString()}
          </p>
          <p className="ticket-info">
            <strong>Hora de llegada:</strong>{" "}
            {new Date(ticketCreado.llegada).toLocaleString()}
          </p>
          <p className="ticket-info">
            <strong>Fecha de compra:</strong>{" "}
            {new Date(ticketCreado.fecha).toLocaleString()}
          </p>

          {qrUrl && (
            <div className="qr-container">
              <h4>QR del Ticket:</h4>
              <img src={qrUrl} alt="QR del ticket" />
            </div>
          )}

          <div className="navigation-buttons">
            <button
              className="nav-button green"
              onClick={() =>
                navigate("/mapa", {
                  state: { bus, ruta, showBusLocation: true },
                })
              }
            >
              Ver Ruta y Ubicación del Bus
            </button>
            <button className="nav-button gray" onClick={() => navigate("/")}>
              Rutas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprarTicket;
