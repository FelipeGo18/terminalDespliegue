import React, { useEffect, useState } from "react";
import { getEmpresas, getRutasPorEmpresa } from "../services/rutasService";
import { getViajesPorRuta } from "../services/viajesService";
import "../styles/Buses.css";

function Buses() {
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [expandedRutaId, setExpandedRutaId] = useState(null); // Solo una ruta expandida
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const data = await getEmpresas();
        if (Array.isArray(data)) {
          setEmpresas(data);
          if (data.length === 0) {
            setMensaje("No hay empresas registradas.");
          } else {
            setMensaje(""); // Clear message if there are empresas
          }
        } else {
          // If data is not an array, it's an unexpected format
          setEmpresas([]); // Fallback to an empty array to prevent .map error
          setMensaje("Error: Los datos de empresas recibidos no son válidos.");
          console.error("getEmpresas() did not return an array. Received:", data);
        }
      } catch (error) {
        setEmpresas([]); // Fallback to an empty array on any error during fetch
        setMensaje("Hubo un error al cargar las empresas.");
        console.error("Error fetching empresas:", error);
      }
    };
    fetchEmpresas();
  }, []);

  // Al hacer click en una empresa, carga sus rutas
  const handleEmpresaClick = async (empresa) => {
    setSelectedEmpresa(empresa);
    setExpandedRutaId(null);
    setViajes([]);
    setMensaje("");
    try {
      const rutasData = await getRutasPorEmpresa(empresa.id);
      setRutas(rutasData);
    } catch (error) {
      setMensaje("Hubo un error al cargar las rutas de la empresa.");
    }
  };

  // Al hacer click en "Ver Viajes" de una ruta, carga los viajes de esa ruta y expande solo esa ruta
  const handleVerViajes = async (ruta) => {
    if (expandedRutaId === ruta.id) {
      setExpandedRutaId(null);
      setViajes([]);
      return;
    }
    setExpandedRutaId(ruta.id);
    setViajes([]);
    setMensaje("");
    try {
      const viajesData = await getViajesPorRuta(ruta.id);
      setViajes(viajesData);
    } catch (error) {
      setMensaje("Hubo un error al cargar los viajes de la ruta.");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "calc(100vh - 40px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="bus-container"
        style={{
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
          borderRadius: 15,
          margin: 0,
          padding: 30,
          minWidth: 400,
          maxWidth: 900,
          width: "100%",
        }}
      >
        <div className="bus-list">
          <h2>Lista de Empresas</h2>
          {mensaje && <p className="bus-error">{mensaje}</p>}
          <div className="bus-grid">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                className={`bus-card${selectedEmpresa && selectedEmpresa.id === empresa.id ? " selected" : ""}`}
                onClick={() => handleEmpresaClick(empresa)}
              >
                <span className="bus-name">{empresa.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedEmpresa && (
          <div className="routes-section">
            <h3>Rutas de {selectedEmpresa.nombre}</h3>
            {rutas.length > 0 ? (
              <ul className="routes-list">
                {rutas.map((ruta, idx) => (
                  <React.Fragment key={ruta.id || `ruta-${idx}`}>
                    <li className="route-item" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <span style={{ flex: 1 }}>{ruta.origen} → {ruta.destino}</span>
                        <button
                          onClick={() => handleVerViajes(ruta)}
                          className="route-button"
                          style={{ marginLeft: 10 }}
                        >
                          {expandedRutaId === ruta.id ? "Ocultar Viajes" : "🚍 Ver Viajes"}
                        </button>
                      </div>
                      {expandedRutaId === ruta.id && (
                        <div style={{ width: "100%", marginTop: 10 }}>
                          {viajes.length > 0 ? (
                            <ul className="trip-list">
                              {viajes.map((viaje) => (
                                <li key={viaje.id} className="trip-item">
                                  🚌 <strong>Bus:</strong> {viaje.numero_bus || viaje.bus_id}, 🕒 <strong>Salida:</strong> {viaje.salida}, 🏁 <strong>Llegada:</strong> {viaje.llegada}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="no-trips">🚫 No hay viajes disponibles para esta ruta.</p>
                          )}
                        </div>
                      )}
                    </li>
                  </React.Fragment>
                ))}
              </ul>
            ) : (
              <p className="no-trips">No hay rutas para esta empresa.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Buses;
