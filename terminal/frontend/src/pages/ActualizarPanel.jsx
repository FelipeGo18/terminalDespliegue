import React, { useEffect, useState } from "react";
import { getEmpresas, getRutas, updateEmpresa, updateRuta } from "../services/rutasService";
import { getBuses, updateBus } from "../services/busesService";
import { getViajes, updateViaje } from "../services/viajesService";
import Swal from "sweetalert2";
import "../styles/AdminPanel.css";

const ActualizarPanel = () => {
  const [empresas, setEmpresas] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [selectedRuta, setSelectedRuta] = useState("");
  const [selectedViaje, setSelectedViaje] = useState("");
  const [editEmpresa, setEditEmpresa] = useState(null);
  const [editBus, setEditBus] = useState(null);
  const [editRuta, setEditRuta] = useState(null);
  const [editViaje, setEditViaje] = useState(null);
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

  const confirmUpdate = async (type, actualizarFn) => {
    const result = await Swal.fire({
      title: `¿Deseas actualizar ${type}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Actualizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#198754"
    });
    if (result.isConfirmed) {
      await actualizarFn();
    }
  };

  const handleSaveEmpresa = async (e) => {
    e.preventDefault();
    try {
      await updateEmpresa(editEmpresa.id, editEmpresa);
      showMessage("Empresa actualizada", "success");
      setEmpresas(await getEmpresas());
      setEditEmpresa(null);
    } catch {
      showMessage("Error al actualizar empresa", "error");
    }
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      await updateBus(editBus.id, editBus);
      showMessage("Bus actualizado", "success");
      setBuses(await getBuses());
      setEditBus(null);
    } catch {
      showMessage("Error al actualizar bus", "error");
    }
  };

  const handleSaveRuta = async (e) => {
    e.preventDefault();
    try {
      await updateRuta(editRuta.id || editRuta.ruta_id, editRuta);
      showMessage("Ruta actualizada", "success");
      setRutas(await getRutas());
      setEditRuta(null);
    } catch {
      showMessage("Error al actualizar ruta", "error");
    }
  };

  const handleSaveViaje = async (e) => {
    e.preventDefault();
    try {
      await updateViaje(editViaje.id, editViaje);
      showMessage("Viaje actualizado", "success");
      setViajes(await getViajes());
      setEditViaje(null);
    } catch {
      showMessage("Error al actualizar viaje", "error");
    }
  };

  return (
    <section className="admin-section">
      <h3 className="admin-section-title actualizar">Actualizar</h3>
      <div style={{ display: "flex", gap: 24, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
        <div className="admin-action-card" onClick={() => setActiveForm("empresa")} style={{ cursor: "pointer", border: activeForm === "empresa" ? "2px solid #f59e42" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#f59e42" }}>
            {/* Icono lápiz/editar empresa */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="13" rx="2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M16 21l4-4-4-4-4 4z"/>
            </svg>
          </span>
          <div className="admin-action-label">Empresa</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("bus")} style={{ cursor: "pointer", border: activeForm === "bus" ? "2px solid #0dcaf0" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#0dcaf0" }}>
            {/* Icono lápiz/editar bus */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="7" width="18" height="8" rx="2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
              <rect x="7" y="9" width="10" height="2" rx="1"/>
              <path d="M20 20l-4-4"/>
            </svg>
          </span>
          <div className="admin-action-label">Bus</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("ruta")} style={{ cursor: "pointer", border: activeForm === "ruta" ? "2px solid #198754" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#198754" }}>
            {/* Icono lápiz/editar ruta */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 17l6-6 4 4 6-6"/>
              <circle cx="4" cy="17" r="2"/>
              <circle cx="10" cy="11" r="2"/>
              <circle cx="14" cy="15" r="2"/>
              <circle cx="20" cy="9" r="2"/>
              <path d="M2 22l4-4"/>
            </svg>
          </span>
          <div className="admin-action-label">Ruta</div>
        </div>
        <div className="admin-action-card" onClick={() => setActiveForm("viaje")} style={{ cursor: "pointer", border: activeForm === "viaje" ? "2px solid #e74c3c" : undefined }}>
          <span className="admin-action-icon" style={{ background: "#e74c3c" }}>
            {/* Icono lápiz/editar viaje */}
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
              <path d="M18 18l-2-2"/>
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
            <span className="admin-form-icon" style={{ background: "#f59e42" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="13" rx="2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M16 21l4-4-4-4-4 4z"/>
              </svg>
            </span>
            Actualizar Empresa
          </div>
          <div className="admin-form-desc">
            Modifica el nombre de la empresa seleccionada.
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
                setEditEmpresa(emp);
              }}
            >Actualizar</button>
          </div>
          {editEmpresa && (
            <form
              onSubmit={e => {
                e.preventDefault();
                confirmUpdate("la empresa", () => handleSaveEmpresa(e));
              }}
              className="admin-form-fields"
            >
              <input
                name="nombre"
                value={editEmpresa.nombre}
                onChange={e => setEditEmpresa({ ...editEmpresa, nombre: e.target.value })}
                required
              />
              <button type="submit" className="admin-form-btn">Guardar</button>
              <button type="button" className="admin-form-btn" onClick={() => setEditEmpresa(null)}>Cancelar</button>
            </form>
          )}
        </div>
      )}
      {activeForm === "bus" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#0dcaf0" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="7" width="18" height="8" rx="2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
                <rect x="7" y="9" width="10" height="2" rx="1"/>
                <path d="M20 20l-4-4"/>
              </svg>
            </span>
            Actualizar Bus
          </div>
          <div className="admin-form-desc">
            Modifica los datos del bus seleccionado.
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
                setEditBus(b);
              }}
            >Actualizar</button>
          </div>
          {editBus && (
            <form
              onSubmit={e => {
                e.preventDefault();
                confirmUpdate("el bus", () => handleSaveBus(e));
              }}
              className="admin-form-fields"
            >
              <input
                name="numero_bus"
                value={editBus.numero_bus}
                onChange={e => setEditBus({ ...editBus, numero_bus: e.target.value })}
                required
              />
              <input
                name="conductor"
                value={editBus.conductor}
                onChange={e => setEditBus({ ...editBus, conductor: e.target.value })}
                required
              />
              <select
                name="empresa_id"
                value={editBus.empresa_id}
                onChange={e => setEditBus({ ...editBus, empresa_id: e.target.value })}
                required
              >
                <option value="">Selecciona la empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
                ))}
              </select>
              <input
                name="cat_asientos"
                type="number"
                value={editBus.cat_asientos}
                onChange={e => setEditBus({ ...editBus, cat_asientos: e.target.value })}
                min={1}
              />
              <button type="submit" className="admin-form-btn">Guardar</button>
              <button type="button" className="admin-form-btn" onClick={() => setEditBus(null)}>Cancelar</button>
            </form>
          )}
        </div>
      )}
      {activeForm === "ruta" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#198754" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 17l6-6 4 4 6-6"/>
                <circle cx="4" cy="17" r="2"/>
                <circle cx="10" cy="11" r="2"/>
                <circle cx="14" cy="15" r="2"/>
                <circle cx="20" cy="9" r="2"/>
                <path d="M2 22l4-4"/>
              </svg>
            </span>
            Actualizar Ruta
          </div>
          <div className="admin-form-desc">
            Modifica los datos de la ruta seleccionada.
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
                setEditRuta(r);
              }}
            >Actualizar</button>
          </div>
          {editRuta && (
            <form
              onSubmit={e => {
                e.preventDefault();
                confirmUpdate("la ruta", () => handleSaveRuta(e));
              }}
              className="admin-form-fields"
            >
              <input
                name="origen"
                value={editRuta.origen}
                onChange={e => setEditRuta({ ...editRuta, origen: e.target.value })}
                required
              />
              <input
                name="destino"
                value={editRuta.destino}
                onChange={e => setEditRuta({ ...editRuta, destino: e.target.value })}
                required
              />
              <input
                name="distancia_km"
                type="number"
                value={editRuta.distancia_km}
                onChange={e => setEditRuta({ ...editRuta, distancia_km: e.target.value })}
                placeholder="Distancia en km"
              />
              <input
                name="duracion_estimada"
                value={editRuta.duracion_estimada}
                onChange={e => setEditRuta({ ...editRuta, duracion_estimada: e.target.value })}
                placeholder="Duración estimada"
              />
              <button type="submit" className="admin-form-btn">Guardar</button>
              <button type="button" className="admin-form-btn" onClick={() => setEditRuta(null)}>Cancelar</button>
            </form>
          )}
        </div>
      )}
      {activeForm === "viaje" && (
        <div className="admin-form-block admin-form-enhanced">
          <div className="admin-form-title">
            <span className="admin-form-icon" style={{ background: "#e74c3c" }}>
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
                <path d="M18 18l-2-2"/>
              </svg>
            </span>
            Actualizar Viaje
          </div>
          <div className="admin-form-desc">
            Modifica los datos del viaje seleccionado.
          </div>
          <div className="admin-form-fields" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={selectedViaje}
              onChange={e => setSelectedViaje(e.target.value)}
              style={{
                width: "100%",
                maxWidth: 350,
                minWidth: 130,
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
              style={{ marginLeft: 0 }}
              onClick={async () => {
                const v = viajes.find(vj => String(vj.id) === String(selectedViaje));
                if (v) setEditViaje(v);
              }}
            >Actualizar</button>
          </div>
          {editViaje && (
            <form
              onSubmit={e => {
                e.preventDefault();
                confirmUpdate("el viaje", () => handleSaveViaje(e));
              }}
              className="admin-form-fields"
            >
              <select
                name="bus_id"
                value={editViaje.bus_id}
                onChange={e => setEditViaje({ ...editViaje, bus_id: e.target.value })}
                required
              >
                <option value="">Selecciona el bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.numero_bus}
                  </option>
                ))}
              </select>
              <select
                name="ruta_id"
                value={editViaje.ruta_id}
                onChange={e => setEditViaje({ ...editViaje, ruta_id: e.target.value })}
                required
              >
                <option value="">Selecciona la ruta</option>
                {rutas.map((ruta) => (
                  <option key={ruta.ruta_id || ruta.id} value={ruta.ruta_id || ruta.id}>
                    {ruta.origen} → {ruta.destino}
                  </option>
                ))}
              </select>
              <input
                name="salida"
                type="datetime-local"
                value={editViaje.salida}
                onChange={e => setEditViaje({ ...editViaje, salida: e.target.value })}
                required
              />
              <input
                name="llegada"
                type="datetime-local"
                value={editViaje.llegada}
                onChange={e => setEditViaje({ ...editViaje, llegada: e.target.value })}
                required
              />
              <input
                name="precio"
                type="number"
                value={editViaje.precio}
                onChange={e => setEditViaje({ ...editViaje, precio: e.target.value })}
                min={0}
                required
              />
              <button type="submit" className="admin-form-btn">Guardar</button>
              <button type="button" className="admin-form-btn" onClick={() => setEditViaje(null)}>Cancelar</button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};

export default ActualizarPanel;
