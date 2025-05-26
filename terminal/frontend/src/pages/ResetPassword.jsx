import React, { useState } from "react";

const ResetPassword = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [repetirContraseña, setRepetirContraseña] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [errorCoincide, setErrorCoincide] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMsg("");
    if (nuevaContraseña !== repetirContraseña) {
      setErrorCoincide(true);
      setMsg(""); // No mostrar mensaje general, solo el de errorCoincide
      return;
    }
    setErrorCoincide(false);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4004/api/usuarios/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContraseña }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
      } else {
        setMsg(data.error || "Error al actualizar la contraseña.");
      }
    } catch {
      setMsg("Error al actualizar la contraseña.");
    }
    setLoading(false);
  };

  if (!token) {
    return <div style={{ padding: 40, textAlign: "center" }}>Token inválido o faltante.</div>;
  }

  return (
    <div className="buscar-buses-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleReset} className="form" style={{ minWidth: 320 }}>
        <p className="form-title">Restablecer contraseña</p>
        <div className="input-container" style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={nuevaContraseña}
            onChange={e => setNuevaContraseña(e.target.value)}
            required
            style={{ marginBottom: 12 }}
          />
          <span
            style={{ cursor: "pointer", right: 10, top: 0, bottom: 0, display: "flex", alignItems: "center", position: "absolute" }}
            onClick={() => setShowPassword(v => !v)}
            tabIndex={0}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06"/>
                <path d="M1 1l22 22"/>
                <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/>
              </svg>
            )}
          </span>
        </div>
        <div className="input-container" style={{ position: "relative" }}>
          <input
            type={showRepeat ? "text" : "password"}
            placeholder="Repite la nueva contraseña"
            value={repetirContraseña}
            onChange={e => {
              setRepetirContraseña(e.target.value);
              setErrorCoincide(false);
              // No limpiar msg aquí, así solo se borra el mensaje de éxito/error, no el de coincidencia
            }}
            required
            style={{ marginBottom: 12, borderColor: errorCoincide ? "#e74c3c" : undefined }}
          />
          <span
            style={{ cursor: "pointer", right: 10, top: 0, bottom: 0, display: "flex", alignItems: "center", position: "absolute" }}
            onClick={() => setShowRepeat(v => !v)}
            tabIndex={0}
            aria-label={showRepeat ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showRepeat ? (
              <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06"/>
                <path d="M1 1l22 22"/>
                <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/>
              </svg>
            )}
          </span>
        </div>
        {errorCoincide ? (
          <div style={{ color: "#e74c3c", fontWeight: 600, marginBottom: 8 }}>
            Las contraseñas no coinciden.
          </div>
        ) : (
          msg && <div style={{ marginTop: 10, color: "#198754", fontWeight: 600 }}>{msg}</div>
        )}
        <button className="header-button" type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
