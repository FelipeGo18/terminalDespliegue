import React, { useState } from "react";
import Header from "../components/Header";
import "../styles.css";
import { loginUsuario } from '../services/usuariosService';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { jwtDecode } from 'jwt-decode';
import axios from "axios";
import Swal from "sweetalert2"; // <-- Agrega SweetAlert

const Login = () => {
  const [email, setEmail] = useState('');
  const [contraseña, setContraseña] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUsuario(email, contraseña);
      const decodedToken = jwtDecode(data.token);

   
      const user = {
        id: decodedToken.id,
        email: decodedToken.email,
        nombre: decodedToken.nombre, 
        rol_id: decodedToken.rol_id, // <-- debe venir aquí si el backend lo envía
        token: data.token
      };

 
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      navigate('/');
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.includes('verificar')
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Verifica tu correo',
          text: 'Debes verificar tu correo antes de iniciar sesión. Haz clic en "¿Olvidaste tu contraseña?" para recibir el código de verificación.',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: 'Verifica tus credenciales.',
        });
      }
    }
  };

  // Enviar link de recuperación al correo
  const handleSendRecoveryLink = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryMsg('');
    try {
      await axios.post('https://terminaldespliegue.onrender.com/api/usuarios/enviar-recuperacion', { email: recoveryEmail });
      setRecoveryMsg('Enlace de recuperación enviado. Revisa tu correo.');
    } catch (err) {
      setRecoveryMsg('No se pudo enviar el enlace. ¿El correo está registrado y verificado?');
    }
    setRecoveryLoading(false);
  };

  return (
    <div className="buscar-buses-bg" style={{ minHeight: '100vh' }}>
      <Header hideAuthButtons={true} />
      <form onSubmit={handleLogin} className="form">
        <p className="form-title">Sign in to your account</p>
        <div className="input-container">
          <input
            placeholder="Enter email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Enter password"
            type="password"
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
          Sign In
        </button>
        <p className="signup-link">
          No account?
          <a href="/register">Sign up</a>
        </p>
        <p className="signup-link">
          <button
            type="button"
            style={{ background: "none", border: "none", color: "#2563eb", textDecoration: "underline", cursor: "pointer", padding: 0, fontSize: 15 }}
            onClick={() => { setShowRecovery(true); setRecoveryMsg(''); }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </p>
      </form>

      {/* Modal de recuperación */}
      {showRecovery && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <h3 style={{ marginBottom: 18, color: "#2563eb" }}>Recuperar contraseña</h3>
            <form onSubmit={handleSendRecoveryLink} style={{ width: "100%" }}>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={recoveryEmail}
                onChange={e => setRecoveryEmail(e.target.value)}
                required
                style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 6, border: "1px solid #ddd" }}
              />
              <button
                type="submit"
                className="header-button"
                style={{ width: "100%", marginBottom: 8 }}
                disabled={recoveryLoading}
              >
                {recoveryLoading ? "Enviando..." : "Enviar enlace"}
              </button>
              <button type="button" onClick={() => setShowRecovery(false)} style={{ background: "none", border: "none", color: "#e74c3c", marginTop: 8, cursor: "pointer" }}>Cancelar</button>
            </form>
            {recoveryMsg && <div style={{ marginTop: 10, color: "#198754", fontWeight: 600 }}>{recoveryMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;