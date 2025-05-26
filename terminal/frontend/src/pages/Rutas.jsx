import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook para navegar entre rutas
import { getRutas } from '../services/rutasService'; // Servicio para obtener rutas
import { getViajesPorRuta } from '../services/viajesService'; // (No se usa actualmente)
import Buscador from '../components/Buscador'; // <-- importar el nuevo componente

// Componente principal que muestra las rutas y los buses disponibles por ruta
function Rutas() {
  const [rutas, setRutas] = useState([]); // Lista de rutas disponibles
  const [mensaje, setMensaje] = useState(''); // Mensaje de error o vacío
  const [selectedRuta, setSelectedRuta] = useState(null); // Ruta seleccionada por el usuario
  const [search, setSearch] = useState(""); // Estado para el buscador
  const navigate = useNavigate(); // Hook para redirección

  // Mueve fetchData fuera para poder llamarlo desde el listener
  const fetchData = async () => {
    try {
      const data = await getRutas();
      if (data && data.length > 0) {
        setRutas(data);
      } else {
        setMensaje('No hay rutas registradas.');
      }
    } catch (error) {
      setMensaje('Error al cargar rutas.');
    }
  };

  // Al montar el componente, se cargan las rutas disponibles
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Recarga rutas al volver de la compra de ticket
  useEffect(() => {
    const handlePopState = () => {
      // Cuando el usuario regresa, recarga rutas
      fetchData();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line
  }, []);

  // Maneja el clic sobre una tarjeta de ruta
  const handleCardClick = (ruta) => {
    setSelectedRuta(ruta); // Marca la ruta como seleccionada
  };

  // Elimina la lógica local de sillas, solo navega y recarga rutas al volver
  const handleComprarTicket = (bus, ruta) => {
    navigate('/comprar-ticket', { state: { bus, ruta } });
  };

  // Filtrar rutas según el buscador
  const rutasFiltradas = rutas.filter(r =>
    (r.origen + " " + r.destino).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, background: '#f5f7fa', minHeight: '80vh' }}>
      {/* Sección izquierda: listado de rutas disponibles */}
      <div style={{ width: 350, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: 600 }}>
        <h2 className="text-2xl font-bold mb-6 text-center">Rutas Disponibles</h2>
        {/* Buscador */}
        <Buscador
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por origen o destino..."
        />
        {mensaje && <p className="text-center text-red-500">{mensaje}</p>}
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {/* Mapeo de rutas: se genera una tarjeta por cada una */}
          {rutasFiltradas?.map((ruta, index) => (
            <div
              key={`ruta-${ruta.ruta_id || index}`}
              className={`card${selectedRuta === ruta ? ' selected' : ''}`} // Marca seleccionada
              style={{ cursor: 'pointer', border: selectedRuta === ruta ? '2px solid var(--color-blue)' : undefined, marginBottom: 12 }}
              onClick={() => handleCardClick(ruta)} // Al hacer clic, se selecciona
            >
              <p className="card-title">{ruta.origen} → {ruta.destino}</p>
              <div className="go-corner">
                <div className="go-arrow">→</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección derecha: detalle de la ruta seleccionada */}
      <div style={{ width: 900, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', minHeight: 600, overflow: 'auto' }}>
        {selectedRuta ? (
          <div
            className="ruta-detalle-animada"
            style={{
              animation: 'fadeSlideInRutaDetalle 0.7s cubic-bezier(.4,0,.2,1)'
            }}
          >
            <h3 className="text-lg font-bold mb-4">Empresas en la ruta {selectedRuta.origen} → {selectedRuta.destino}</h3>
            {/* Se muestran las empresas que operan en esta ruta */}
            {selectedRuta.empresas?.map((empresa, empresaIdx) => (
              <div key={`empresa-${empresa.empresa_id}`} className="mt-2">
                {/* Se muestran los buses de cada empresa */}
                {empresa.buses?.map((bus, idx) => (
                  <div
                    key={`bus-${empresa.empresa_id}-${bus.bus_id ?? idx}`}
                    className="bus-card-animada"
                    style={{
                      background: 'var(--color-soft)', 
                      borderRadius: 16,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #e0e0e0',
                      marginBottom: 18,
                      maxWidth: 700,
                      minWidth: 0,
                      width: '100%'
                    }}
                  >
                    {/* Sección con logo y nombre de la empresa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 120 }}>
                      <img src="https://static.vecteezy.com/system/resources/previews/046/854/681/non_2x/passenger-bus-isolated-on-transparent-background-free-png.png" alt="Empresa" style={{ width: 60, height: 30, objectFit: 'contain', background: '#fff', borderRadius: 8 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{empresa.empresa_nombre || 'Empresa'}</div>
                        <div style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: '#f7b500', fontWeight: 700, fontSize: 14 }}>★</span> 4.5
                        </div>
                      </div>
                    </div>

                    {/* Sección con horarios y características del bus */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 18, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 18, marginBottom: 6 }}>
                        {/* Hora de salida */}
                        <div>
                          <div style={{ color: '#888', fontSize: 11 }}>Salida</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>
                            {bus.salida
                              ? new Date(bus.salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '--:--'}
                          </div>
                          <div style={{ color: '#555', fontSize: 12 }}>{selectedRuta.origen || 'Terminal de Salida'}</div>
                        </div>
                        {/* Hora de llegada */}
                        <div>
                          <div style={{ color: '#888', fontSize: 11 }}>Llegada Aprox</div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>
                            {bus.llegada
                              ? new Date(bus.llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '--:--'}
                          </div>
                          <div style={{ color: '#555', fontSize: 12 }}>{selectedRuta.destino || 'Terminal de Llegada'}</div>
                        </div>
                      </div>
    
                    </div>

                    {/* Precio y botón para ver sillas disponibles */}
                    <div style={{ minWidth: 120, textAlign: 'right' }}>
                      <div style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>{bus.sillas_disponibles || 17} sillas disponibles</div>
                      <div style={{ color: '#00b140', fontWeight: 700, fontSize: 18, marginBottom: 2 }}>
                        {bus.precio !== undefined && bus.precio !== null
                          ? `$${Number(bus.precio).toLocaleString()}`
                          : 'No definido'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleComprarTicket(bus, selectedRuta)}
                          className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition"
                          style={{ fontWeight: 700, fontSize: 14 }}
                        >
                          Comprar ticket
                        </button>
                        <button
                          onClick={() => navigate('/mapa', { state: { bus, ruta: selectedRuta, showBusLocation: true } })}
                          className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition"
                          style={{ fontWeight: 700, fontSize: 14 }}
                        >
                          Ver Ruta en Mapa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          // Si no hay ruta seleccionada, se muestra un mensaje
          <div className="empresa-card" style={{ opacity: 0.7, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p>Selecciona una ruta para ver los detalles aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rutas;
