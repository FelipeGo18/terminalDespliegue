import React, { useState } from "react";
import "../styles.css";
import Header from "../components/Header";
import { registerUsuario } from '../services/usuariosService';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Swal from "sweetalert2"; // <-- Agrega SweetAlert

const Register = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyStep, setVerifyStep] = useState(1);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    const usuario = { nombre, email, contraseña, rol_id: 1 }; // rol_id predeterminado
    try {
      await registerUsuario(usuario);
      setVerifyEmail(email);
      setShowVerify(true);
      setVerifyStep(1);
      setVerifyMsg('Te enviamos un código de verificación a tu correo.');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar usuario',
        text: 'No se pudo registrar el usuario. Intenta de nuevo.',
      });
    }
  };

  // Enviar código de verificación
  const handleSendCode = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      await fetch('http://localhost:4004/api/usuarios/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      setVerifyMsg('Código enviado al correo. Revisa tu bandeja de entrada.');
      setVerifyStep(2);
    } catch {
      setVerifyMsg('No se pudo enviar el código. ¿El correo está registrado?');
    }
    setVerifyLoading(false);
  };

  // Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyMsg('');
    try {
      await fetch('http://localhost:4004/api/usuarios/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode })
      });
      setVerifyMsg('Correo verificado correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => {
        setShowVerify(false);
        navigate('/login');
      }, 1800);
    } catch {
      setVerifyMsg('Código incorrecto o expirado.');
    }
    setVerifyLoading(false);
  };

  return (
    <div className="buscar-buses-bg" style={{ minHeight: '100vh' }}>
      <Header hideAuthButtons={true} />
      <form onSubmit={handleRegister} className="form">
        <p className="form-title">Create your account</p>
        <div className="input-container">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <span>
            <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
            </svg>
          </span>
        </div>
        <div className="input-container">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <span>
            <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
            </svg>
          </span>
        </div>
        <div className="input-container">
          <input
            type="password"
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />
          <span>
            <svg stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
            </svg>
          </span>
        </div>
        <button className="header-button" type="submit">
          Register
        </button>
        <p className="signup-link">
          Already have an account?
          <a href="/login">Sign in</a>
        </p>
      </form>
      {/* Modal de verificación */}
      {showVerify && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <h3 style={{ marginBottom: 18, color: "#2563eb" }}>Verifica tu correo</h3>
            {verifyStep === 1 && (
              <form onSubmit={handleSendCode} style={{ width: "100%" }}>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={verifyEmail}
                  onChange={e => setVerifyEmail(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
                />
                <button
                  type="submit"
                  className="header-button"
                  style={{ width: "100%", marginBottom: 8 }}
                  disabled={verifyLoading}
                >
                  {verifyLoading ? "Enviando..." : "Enviar código"}
                </button>
                <button type="button" onClick={() => setShowVerify(false)} style={{ background: "none", border: "none", color: "#e74c3c", marginTop: 8, cursor: "pointer" }}>Cancelar</button>
              </form>
            )}
            {verifyStep === 2 && (
              <form onSubmit={handleVerifyCode} style={{ width: "100%" }}>
                <input
                  type="text"
                  placeholder="Código recibido"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value)}
                  required
                  style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
                />
                <button
                  type="submit"
                  className="header-button"
                  style={{ width: "100%", marginBottom: 8 }}
                  disabled={verifyLoading}
                >
                  {verifyLoading ? "Verificando..." : "Verificar código"}
                </button>
                <button type="button" onClick={() => setShowVerify(false)} style={{ background: "none", border: "none", color: "#e74c3c", marginTop: 8, cursor: "pointer" }}>Cancelar</button>
              </form>
            )}
            {verifyMsg && <div style={{ marginTop: 10, color: "#198754", fontWeight: 600 }}>{verifyMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;