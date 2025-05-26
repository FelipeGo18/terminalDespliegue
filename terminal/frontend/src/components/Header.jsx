import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/terminal-logo.png";
import { useUser } from '../context/UserContext';

const Header = ({ hideAuthButtons }) => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  useEffect(() => {
    console.log('User in Header:', user);
  }, [user]);

  return (
    <header className="custom-header">
      <div className="header-container">
        <img src={logo} alt="Logo" className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        {!hideAuthButtons && (
          <div className="button-group">
            {user ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(0, 153, 255, 0.08)',
                    padding: '6px 18px 6px 10px',
                    borderRadius: 24,
                    fontWeight: 500,
                    fontSize: 16,
                    transition: 'box-shadow 0.3s, background 0.3s, transform 0.3s',
                    boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
                    animation: 'fadeInUser 0.7s cubic-bezier(.4,0,.2,1)',
                    cursor: 'pointer'
                  }}
                  className="user-greeting-animated"
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 60%, #06b6d4 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 18,
                      boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
                      animation: 'avatarPop 0.7s cubic-bezier(.4,0,.2,1)'
                    }}
                  >
                    {user.nombre?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#222', fontSize: 15 }}>Bienvenido</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#2563eb',
                        fontSize: 17,
                        lineHeight: 1,
                        animation: 'slideInName 0.7s cubic-bezier(.4,0,.2,1)'
                      }}
                    >
                      {user.nombre}
                    </div>
                  </div>
                </div>
                <button onClick={logout} className="header-button" style={{ marginLeft: 16 }}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-button">Iniciar sesión</Link>
                <Link to="/register" className="header-button">Registrarse</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
