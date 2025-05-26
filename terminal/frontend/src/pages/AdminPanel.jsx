import React, { useState } from "react";
import CrearPanel from "./CrearPanel";
import BorrarPanel from "./BorrarPanel";
import ActualizarPanel from "./ActualizarPanel";
import "../styles/AdminPanel.css";

const AdminPanel = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState("");

  return (
    <div className="admin-panel-bg">
      <div className={`admin-panel-container${!activeSection ? " compact" : ""}`}>
        {/* Botón para regresar al MainContent */}
        <button
          style={{
            position: "absolute",
            left: 24,
            top: 24,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
            zIndex: 10
          }}
          onClick={() => {
            if (typeof onBack === "function") onBack();
            else window.location.href = "/"; // fallback si no hay prop
          }}
        >
          ⬅ Regresar
        </button>
        {!activeSection && (
          <div className="admin-panel-center">
            <h2 className="admin-panel-title">Panel de Administración</h2>
            <div className="admin-panel-buttons">
              <button className="admin-btn crear" onClick={() => setActiveSection("crear")}>Crear</button>
              <button className="admin-btn borrar" onClick={() => setActiveSection("borrar")}>Borrar</button>
              <button className="admin-btn actualizar" onClick={() => setActiveSection("actualizar")}>Actualizar</button>
            </div>
          </div>
        )}
        {activeSection && (
          <>
            <h2 className="admin-panel-title">Panel de Administración</h2>
            <div className="admin-panel-buttons">
              <button className={`admin-btn crear${activeSection === "crear" ? " active" : ""}`} onClick={() => setActiveSection("crear")}>Crear</button>
              <button className={`admin-btn borrar${activeSection === "borrar" ? " active" : ""}`} onClick={() => setActiveSection("borrar")}>Borrar</button>
              <button className={`admin-btn actualizar${activeSection === "actualizar" ? " active" : ""}`} onClick={() => setActiveSection("actualizar")}>Actualizar</button>
            </div>
            {activeSection === "crear" && (
              <div className="admin-section-anim">
                <CrearPanel />
              </div>
            )}
            {activeSection === "borrar" && (
              <div className="admin-section-anim">
                <BorrarPanel />
              </div>
            )}
            {activeSection === "actualizar" && (
              <div className="admin-section-anim">
                <ActualizarPanel />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;