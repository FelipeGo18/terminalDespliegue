import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext"; // Importa el contexto de usuario

function Sidebar({ onSelect }) {
  const navigate = useNavigate();
  const { user } = useUser(); // Obtiene el usuario actual

  return (
    <aside
      className="w-64 bg-[var(--color-800)] text-white p-6 space-y-4"
      style={{
        border: "0.1px solid var(--color-lime)",
        width: 150,
        minWidth: 150,
        maxWidth: 150,
      }}
    >
      <button
        onClick={() => onSelect("buses")}
        className="w-full text-left px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
      >
        Agencias
      </button>
      <button
        onClick={() => onSelect("rutas")}
        className="w-full text-left px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
      >
        Rutas
      </button>
      <button
        onClick={() => onSelect("buscarBuses")}
        className="w-full text-left px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
      >
        Buscar Buses
      </button>
      {/* Solo muestra el Panel Admin si el usuario tiene rol_id === 3 */}
      {user && Number(user.rol_id) === 3 && (
        <button
          onClick={() => navigate("/admin")}
          className="w-full text-left px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
          style={{ fontWeight: 600 }}
        >
          Panel Admin
        </button>
      )}
    </aside>
  );
}

export default Sidebar;

