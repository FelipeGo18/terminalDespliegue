import React, { useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4004';

const SimuladorUbicacionBus = () => {
  const [busId, setBusId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [enviando, setEnviando] = useState(false);
  const socketRef = useRef(null);

  const conectarSocket = () => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
  };

  const enviarUbicacion = () => {
    if (!busId || !lat || !lng) return;
    conectarSocket();
    socketRef.current.emit('updateBusLocation', {
      busId,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
    setEnviando(true);
    setTimeout(() => setEnviando(false), 1000);
  };

  // Simulación automática (opcional)
  const simularRuta = () => {
    conectarSocket();
    let i = 0;
    // Ejemplo: puntos entre Bogotá y Medellín
    const puntos = [
      { lat: 4.710989, lng: -74.072092 }, // Bogotá
      { lat: 5.0, lng: -74.5 },
      { lat: 5.5, lng: -75.0 },
      { lat: 6.244203, lng: -75.581211 } // Medellín
    ];
    const interval = setInterval(() => {
      if (i >= puntos.length) {
        clearInterval(interval);
        return;
      }
      socketRef.current.emit('updateBusLocation', {
        busId,
        lat: puntos[i].lat,
        lng: puntos[i].lng
      });
      i++;
    }, 2000);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Simulador de Ubicación de Bus</h2>
      <div>
        <label>
          Bus ID:
          <input value={busId} onChange={e => setBusId(e.target.value)} />
        </label>
        <label>
          Latitud:
          <input value={lat} onChange={e => setLat(e.target.value)} />
        </label>
        <label>
          Longitud:
          <input value={lng} onChange={e => setLng(e.target.value)} />
        </label>
        <button onClick={enviarUbicacion} disabled={enviando}>
          Enviar Ubicación
        </button>
        <button onClick={simularRuta} disabled={!busId}>
          Simular Ruta Automática
        </button>
      </div>
      <p>
        Usa el mismo <strong>busId</strong> que el bus que quieres simular para que los clientes vean la ubicación en tiempo real.
      </p>
    </div>
  );
};

export default SimuladorUbicacionBus;
