import React, { useEffect, useState } from "react";
import { getEmpresas, getRutas, deleteEmpresa, deleteRuta } from "../services/rutasService";
import { getBuses, deleteBus } from "../services/busesService";
import { getViajes, deleteViaje } from "../services/viajesService";
import Swal from "sweetalert2";
import "../styles/AdminPanel.css";

const BorrarPanel = () => {
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedRuta, setSelectedRuta] = useState("");
  const [selectedViaje, setSelectedViaje] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setEmpresas(await getEmpresas());
      setRutas(await getRutas());
      setBuses(await getBuses());
      setViajes(await getViajes());
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

  const confirmDelete = async (type, id, name, borrarFn) => {
    const result = await Swal.fire({
      title: `¿Seguro que deseas borrar ${type}?`,
      text: name,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e74c3c"
    });
    if (result.isConfirmed) {
      await borrarFn(id);
    }
  };

  const handleDeleteEmpresa = async (id) => {
    try {
      await deleteEmpresa(id);
      showMessage("Empresa eliminada", "success");
      setEmpresas(await getEmpresas());
    } catch {
      showMessage("Error al eliminar empresa", "error");
    }
  };

  const handleDeleteBus = async (id) => {
    try {
      await deleteBus(id);
      showMessage("Bus eliminado", "success");
      setBuses(await getBuses());
    } catch {
      showMessage("Error al eliminar bus", "error");
    }
  };

  const handleDeleteRuta = async (id) => {
    try {
      await deleteRuta(id);
      showMessage("Ruta eliminada", "success");
      setRutas(await getRutas());
    } catch {
      showMessage("Error al eliminar ruta", "error");
    }
  };

  const handleDeleteViaje = async (id) => {
    try {
      await deleteViaje(id);
      showMessage("Viaje eliminado", "success");
      setViajes(await getViajes());
    } catch {
      showMessage("Error al eliminar viaje", "error");
    }
  };

  return (
    <section className="admin-section">
      <h3 className="admin-section-title borrar">Borrar</h3>
      <div style={{ display: "flex", gap: 24, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
        <div className="admin-action-card" onClick={() => setActiveForm("empresa")} style={{ cursor: "pointer", border: activeForm === "empresa" ? "2px solid #0dcaf0" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#0dcaf0" }}>
            {/* Icono papelera */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="15" rx="2"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="1" y1="6" x2="23" y2="6"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </span>
          <div className="admin-action-label">Empresa</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("bus")} style={{ cursor: "pointer", border: activeForm === "bus" ? "2px solid #f59e42" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#f59e42" }}>
            {/* Icono bus con X */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="8" rx="2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
              <rect x="7" y="9" width="10" height="2" rx="1"/>
              <line x1="6" y1="7" x2="18" y2="15"/>
              <line x1="18" y1="7" x2="6" y2="15"/>
            </svg>
          </span>
          <div className="admin-action-label">Bus</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("ruta")} style={{ cursor: "pointer", border: activeForm === "ruta" ? "2px solid #e74c3c" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#e74c3c" }}>
            {/* Icono ruta/mapa con X */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 17l6-6 4 4 6-6"/>
              <circle cx="4" cy="17" r="2"/>
              <circle cx="10" cy="11" r="2"/>
              <circle cx="14" cy="15" r="2"/>
              <circle cx="20" cy="9" r="2"/>
              <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
          </span>
          <div className="admin-action-label">Ruta</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("viaje")} style={{ cursor: "pointer", border: activeForm === "viaje" ? "2px solid #198754" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#198754" }}>
            {/* Icono reloj/viaje con X */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
          <div className="admin-action-label">Viaje</div>
        </div>
      </div>
      {mensaje && (
        <div className={`admin-message ${mensajeTipo}`}>{mensaje}</div>
      )}
      {activeForm === "empresa" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#0dcaf0" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="15" rx="2"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </span>
            Borrar Empresa
          </div>
          <div className="admin-form-desc">
            Selecciona una empresa para eliminarla del sistema. Esta acción es irreversible.
          </div>
          <div className="admin-form-fields">
            <select value={selectedEmpresa} onChange={e => setSelectedEmpresa(e.target.value)}>
              <option value="">Selecciona una empresa</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
            <button
              className="admin-form-btn"
              disabled={!selectedEmpresa}
              onClick={async () => {
                const emp = empresas.find(e => String(e.id) === String(selectedEmpresa));
                await confirmDelete("la empresa", selectedEmpresa, emp?.nombre, handleDeleteEmpresa);
                setSelectedEmpresa("");
              }}
            >Borrar</button>
          </div>
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
                <line x1="6" y1="7" x2="18" y2="15"/>
                <line x1="18" y1="7" x2="6" y2="15"/>
              </svg>
            </span>
            Borrar Bus
          </div>
          <div className="admin-form-desc">
            Elimina un bus registrado. Asegúrate de que no tenga viajes activos antes de borrar.
          </div>
          <div className="admin-form-fields">
            <select value={selectedBus} onChange={e => setSelectedBus(e.target.value)}>
              <option value="">Selecciona un bus</option>
              {buses.map(b => (
                <option key={b.id} value={b.id}>{b.numero_bus}</option>
              ))}
            </select>
            <button
              className="admin-form-btn"
              disabled={!selectedBus}
              onClick={async () => {
                const b = buses.find(bus => String(bus.id) === String(selectedBus));
                await confirmDelete("el bus", selectedBus, b?.numero_bus, handleDeleteBus);
                setSelectedBus("");
              }}
            >Borrar</button>
          </div>
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
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </span>
            Borrar Ruta
          </div>
          <div className="admin-form-desc">
            Elimina una ruta existente. Esto puede afectar los viajes asociados a la ruta.
          </div>
          <div className="admin-form-fields">
            <select value={selectedRuta} onChange={e => setSelectedRuta(e.target.value)}>
              <option value="">Selecciona una ruta</option>
              {rutas.map(r => (
                <option key={r.ruta_id || r.id} value={r.ruta_id || r.id}>{r.origen} → {r.destino}</option>
              ))}
            </select>
            <button
              className="admin-form-btn"
              disabled={!selectedRuta}
              onClick={async () => {
                const r = rutas.find(rt => String(rt.ruta_id || rt.id) === String(selectedRuta));
                await confirmDelete("la ruta", selectedRuta, `${r?.origen} → ${r?.destino}`, handleDeleteRuta);
                setSelectedRuta("");
              }}
            >Borrar</button>
          </div>
        </div>
      )}
      {activeForm === "viaje" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#198754" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </span>
            Borrar Viaje
          </div>
          <div className="admin-form-desc">
            Elimina un viaje programado. Los pasajeros perderán su reserva si existe.
          </div>
          <div className="admin-form-fields" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={selectedViaje}
              onChange={e => setSelectedViaje(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 350,
                minWidth: 100,
                fontSize: 13,
                padding: "2px 2px"
              }}
            >
              <option value="">Selecciona un viaje</option>
              {viajes.map(v => (
                <option key={v.id} value={v.id}>
                  Bus: {v.numero_bus ? v.numero_bus : `Bus ID ${v.bus_id ?? 'N/A'}`}
                  {" | "}
                  Ruta: {v.origen && v.destino ? `${v.origen} → ${v.destino}` : `Ruta ID ${v.ruta_id ?? 'N/A'}`}
                  {" | "}
                  Salida: {v.salida ? new Date(v.salida).toLocaleString() : '--'}
                  {" | "}
                  Precio: {v.precio !== undefined && v.precio !== null ? `$${Number(v.precio).toLocaleString()}` : '--'}
                </option>
              ))}
            </select>
            <button
              className="admin-form-btn"
              disabled={!selectedViaje}
              onClick={async () => {
                const v = viajes.find(vj => String(vj.id) === String(selectedViaje));
                if (!v) {
                  showMessage("No se encontró el viaje seleccionado", "error");
                  setSelectedViaje("");
                  return;
                }
                try {
                  await confirmDelete(
                    "el viaje",
                    v.id,
                    `Bus: ${v.numero_bus ? v.numero_bus : `Bus ID ${v.bus_id ?? 'N/A'}`} | Ruta: ${v.origen && v.destino ? `${v.origen} → ${v.destino}` : `Ruta ID ${v.ruta_id ?? 'N/A'}`} | Salida: ${v.salida ? new Date(v.salida).toLocaleString() : '--'} | Precio: ${v.precio !== undefined && v.precio !== null ? `$${Number(v.precio).toLocaleString()}` : '--'}`,
                    handleDeleteViaje
                  );
                  setSelectedViaje("");
                } catch (err) {
                  showMessage("Error al borrar el viaje", "error");
                }
              }}
            >Borrar</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BorrarPanel;
