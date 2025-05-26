import React from "react";

const Buscador = ({ value, onChange, placeholder = "Buscar..." }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      width: "100%",
      padding: "8px 12px",
      marginBottom: 16,
      borderRadius: 6,
      border: "1px solid #d1d5db",
      fontSize: 15
    }}
  />
);

export default Buscador;
