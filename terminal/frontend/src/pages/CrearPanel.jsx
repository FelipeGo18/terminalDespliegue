import React, { useEffect, useState } from "react";
import { createBus, getBuses } from "../services/busesService";
import { createRuta, getRutas, getEmpresas, createEmpresa } from "../services/rutasService";
import { createViaje, getViajes } from "../services/viajesService";
import "../styles/AdminPanel.css";

const CrearPanel = () => {
  const [bus, setBus] = useState({ numero_bus: "", conductor: "", empresa_id: "", cat_asientos: 40 });
  const [ruta, setRuta] = useState({ origen: "", destino: "", distancia_km: "", duracion_estimada: "" });
  const [viaje, setViaje] = useState({ bus_id: "", ruta_id: "", salida: "", llegada: "", precio: "" });
  const [empresa, setEmpresa] = useState({ nombre: "" });
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setEmpresas(await getEmpresas());
      setRutas(await getRutas());
      setBuses(await getBuses());
    };
    fetchData();
  }, []);

  const showMessage = (msg, tipo = "success") => {
    setMensaje(msg);
    setMensajeTipo(tipo);
    setTimeout(() => {
      setMensaje("");
      setMensajeTipo("");
    }, 2500);
  };

  const handleBusChange = (e) => setBus({ ...bus, [e.target.name]: e.target.value });
  const handleRutaChange = (e) => setRuta({ ...ruta, [e.target.name]: e.target.value });
  const handleViajeChange = (e) => setViaje({ ...viaje, [e.target.name]: e.target.value });
  const handleEmpresaChange = (e) => setEmpresa({ ...empresa, [e.target.name]: e.target.value });

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBus(bus);
      showMessage("Bus creado correctamente", "success");
      setBus({ numero_bus: "", conductor: "", empresa_id: "", cat_asientos: 40 });
      setBuses(await getBuses());
    } catch {
      showMessage("Error al crear bus", "error");
    }
  };

  const handleRutaSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRuta(ruta);
      showMessage("Ruta creada correctamente", "success");
      setRuta({ origen: "", destino: "", distancia_km: "", duracion_estimada: "" });
      setRutas(await getRutas());
    } catch {
      showMessage("Error al crear ruta", "error");
    }
  };

  const handleViajeSubmit = async (e) => {
    e.preventDefault();
    try {
      // Solo envía los campos requeridos y precio solo si es un número válido
      const { bus_id, ruta_id, salida, llegada, precio } = viaje;
      if (!bus_id || !ruta_id || !salida || !llegada) {
        showMessage("Completa todos los campos obligatorios", "error");
        return;
      }
      const viajeData = { bus_id, ruta_id, salida, llegada };
      if (precio !== "" && !isNaN(Number(precio))) {
        viajeData.precio = Number(precio);
      }
      await createViaje(viajeData);
      showMessage("Viaje creado correctamente", "success");
      setViaje({ bus_id: "", ruta_id: "", salida: "", llegada: "", precio: "" });
    } catch (err) {
      // Mostrar error específico si el municipio de origen no existe
      if (
        err?.response?.data?.error &&
        err.response.data.error.includes("municipio de origen")
      ) {
        showMessage(
          "Error: El municipio de origen de la ruta seleccionada no existe en la tabla municipios. Corrige el nombre del municipio en la ruta o crea el municipio primero.",
          "error"
        );
      } else {
        showMessage("Error al crear viaje", "error");
      }
      console.error("Error al crear viaje:", err?.response?.data || err);
    }
  };

  const handleEmpresaSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmpresa(empresa);
      showMessage("Empresa creada correctamente", "success");
      setEmpresa({ nombre: "" });
      setEmpresas(await getEmpresas());
    } catch {
      showMessage("Error al crear empresa", "error");
    }
  };

  return (
    <section className="admin-section">
      <h3 className="admin-section-title crear">Crear</h3>
      {/* Diseño adicional: iconos y cards */}
      <div style={{ display: "flex", gap: 24, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
        <div className="admin-action-card" onClick={() => setActiveForm("empresa")} style={{ cursor: "pointer", border: activeForm === "empresa" ? "2px solid #0dcaf0" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#0dcaf0" }}>
            {/* Icono edificio/empresa */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2"/>
              <rect x="7" y="11" width="2" height="2" rx="0.5"/>
              <rect x="11" y="11" width="2" height="2" rx="0.5"/>
              <rect x="15" y="11" width="2" height="2" rx="0.5"/>
              <rect x="7" y="15" width="2" height="2" rx="0.5"/>
              <rect x="11" y="15" width="2" height="2" rx="0.5"/>
              <rect x="15" y="15" width="2" height="2" rx="0.5"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </span>
          <div className="admin-action-label">Empresa</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("bus")} style={{ cursor: "pointer", border: activeForm === "bus" ? "2px solid #f59e42" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#f59e42" }}>
            {/* Icono bus */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="8" rx="2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
              <rect x="7" y="9" width="10" height="2" rx="1"/>
            </svg>
          </span>
          <div className="admin-action-label">Bus</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("ruta")} style={{ cursor: "pointer", border: activeForm === "ruta" ? "2px solid #e74c3c" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#e74c3c" }}>
            {/* Icono ruta/mapa */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 17l6-6 4 4 6-6"/>
              <circle cx="4" cy="17" r="2"/>
              <circle cx="10" cy="11" r="2"/>
              <circle cx="14" cy="15" r="2"/>
              <circle cx="20" cy="9" r="2"/>
            </svg>
          </span>
          <div className="admin-action-label">Ruta</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("viaje")} style={{ cursor: "pointer", border: activeForm === "viaje" ? "2px solid #198754" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#198754" }}>
            {/* Icono reloj/viaje */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </span>
          <div className="admin-action-label">Viaje</div>
        </div>
      </div>
      {mensaje && (
        <div className={`admin-message ${mensajeTipo}`}>{mensaje}</div>
      )}
      {/* Mostrar solo el formulario seleccionado */}
      {activeForm === "empresa" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#0dcaf0" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="13" rx="2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            </span>
            Crear Empresas
          </div>
          <div className="admin-form-desc">
            Registra una nueva empresa de transporte para que pueda operar rutas y buses en el sistema.
          </div>
          <form onSubmit={handleEmpresaSubmit} className="admin-form-fields">
            <input name="nombre" placeholder="Nombre de la empresa" value={empresa.nombre} onChange={handleEmpresaChange} required />
            <button type="submit" className="admin-form-btn">Crear Empresa</button>
          </form>
        </div>
      )}
      {activeForm === "bus" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#f59e42" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="8" rx="2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
                <rect x="7" y="9" width="10" height="2" rx="1"/>
              </svg>
            </span>
            Crear Buses
          </div>
          <div className="admin-form-desc">
            Agrega un nuevo bus, asigna su empresa y conductor, y define la cantidad de asientos.
          </div>
          <form onSubmit={handleBusSubmit} className="admin-form-fields">
            <input name="numero_bus" placeholder="Número de bus" value={bus.numero_bus} onChange={handleBusChange} required />
            <input name="conductor" placeholder="Conductor" value={bus.conductor} onChange={handleBusChange} required />
            <select name="empresa_id" value={bus.empresa_id} onChange={handleBusChange} required>
              <option value="">Selecciona la empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
              ))}
            </select>
            <input name="cat_asientos" type="number" placeholder="Cantidad de asientos" value={bus.cat_asientos} onChange={handleBusChange} min={1} />
            <button type="submit" className="admin-form-btn">Crear Bus</button>
          </form>
        </div>
      )}
      {activeForm === "ruta" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#e74c3c" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 17l6-6 4 4 6-6"/>
                <circle cx="4" cy="17" r="2"/>
                <circle cx="10" cy="11" r="2"/>
                <circle cx="14" cy="15" r="2"/>
                <circle cx="20" cy="9" r="2"/>
              </svg>
            </span>
            Crear Rutas
          </div>
          <div className="admin-form-desc">
            Define una nueva ruta entre dos ciudades, incluyendo distancia y duración estimada.
          </div>
          <form onSubmit={handleRutaSubmit} className="admin-form-fields">
            <input name="origen" placeholder="Origen" value={ruta.origen} onChange={handleRutaChange} required />
            <input name="destino" placeholder="Destino" value={ruta.destino} onChange={handleRutaChange} required />
            <input name="distancia_km" type="number" placeholder="Distancia (km)" value={ruta.distancia_km} onChange={handleRutaChange} />
            <input name="duracion_estimada" placeholder="Duración estimada" value={ruta.duracion_estimada} onChange={handleRutaChange} />
            <button type="submit" className="admin-form-btn">Crear Ruta</button>
          </form>
        </div>
      )}
      {activeForm === "viaje" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#198754" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </span>
            Crear Viajes
          </div>
          <div className="admin-form-desc">
            Programa un viaje seleccionando bus, ruta, horario de salida y llegada, y precio.
          </div>
          <form onSubmit={handleViajeSubmit} className="admin-form-fields">
            <select name="bus_id" value={viaje.bus_id} onChange={handleViajeChange} required>
              <option value="">Selecciona el bus</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.numero_bus}
                </option>
              ))}
            </select>
            <select name="ruta_id" value={viaje.ruta_id} onChange={handleViajeChange} required>
              <option value="">Selecciona la ruta</option>
              {rutas.map((ruta) => (
                <option key={ruta.ruta_id || ruta.id} value={ruta.ruta_id || ruta.id}>
                  {ruta.origen} → {ruta.destino}
                </option>
              ))}
            </select>
            <input name="salida" type="datetime-local" placeholder="Salida" value={viaje.salida} onChange={handleViajeChange} required />
            <input name="llegada" type="datetime-local" placeholder="Llegada" value={viaje.llegada} onChange={handleViajeChange} required />
            <input name="precio" type="number" placeholder="Precio (opcional)" value={viaje.precio} onChange={handleViajeChange} min={0} />
            <button type="submit" className="admin-form-btn">Crear Viaje</button>
          </form>
        </div>
      )}
    </section>
  );
};

export default CrearPanel;
