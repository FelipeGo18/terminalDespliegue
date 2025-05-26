import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { getBusesPorOrigenDestino } from '../services/busesService';
import { getMunicipios } from '../services/municipiosService'; // Debes crear este servicio si no existe
import { useNavigate } from 'react-router-dom';
import '../styles.css';

// Autocompletador simple
function AutocompleteInput({ value, onChange, suggestions, placeholder }) {
    const [show, setShow] = useState(false);
    const [filtered, setFiltered] = useState([]);

    useEffect(() => {
        if (value && suggestions.length > 0) {
            setFiltered(
                suggestions.filter(
                    s => s.toLowerCase().includes(value.toLowerCase())
                ).slice(0, 8)
            );
            setShow(true);
        } else {
            setShow(false);
        }
    }, [value, suggestions]);

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                style={{
                    width: "100%",
                    padding: "8px 12px",
                    marginBottom: 16,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 15
                }}
                onFocus={() => setShow(true)}
                onBlur={() => setTimeout(() => setShow(false), 120)}
            />
            {show && filtered.length > 0 && (
                <ul style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    zIndex: 10,
                    maxHeight: 180,
                    overflowY: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyle: 'none'
                }}>
                    {filtered.map((s, idx) => (
                        <li
                            key={s + idx}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: idx < filtered.length - 1 ? '1px solid #eee' : 'none'
                            }}
                            onMouseDown={() => onChange({ target: { value: s } })}
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Tarifa por kilómetro más realista (ejemplo: $120/km)
const TARIFA_KM = 120;

const BuscarBuses = () => {
    const [origen, setOrigen] = useState('');
    const [destino, setDestino] = useState('');
    const [buses, setBuses] = useState([]);
    const [error, setError] = useState(null);
    const [origenBuscado, setOrigenBuscado] = useState('');
    const [destinoBuscado, setDestinoBuscado] = useState('');
    const [municipios, setMunicipios] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Cargar municipios para autocompletar
        async function fetchMunicipios() {
            try {
                const data = await getMunicipios();
                setMunicipios(data.map(m => m.nombre));
            } catch {
                setMunicipios([]);
            }
        }
        fetchMunicipios();
    }, []);

    const handleBuscar = async (e) => {
        e.preventDefault();
        const cleanedOrigen = origen.trim();
        const cleanedDestino = destino.trim();

        // Solo permitir municipios válidos
        if (!municipios.includes(cleanedOrigen) || !municipios.includes(cleanedDestino)) {
            setError('Debes seleccionar origen y destino de la lista de municipios sugeridos.');
            return;
        }
        if (!cleanedOrigen || !cleanedDestino) {
            setError('Por favor, ingresa el origen y el destino.');
            return;
        }

        try {
            const data = await getBusesPorOrigenDestino(cleanedOrigen, cleanedDestino);
            setBuses(data);
            setError(null);
            setOrigenBuscado(cleanedOrigen);
            setDestinoBuscado(cleanedDestino);
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudieron obtener los buses. Verifica los datos ingresados.');
        }
    };

    return (
        <>
            <form className="form" onSubmit={handleBuscar}>
                <p className="form-title">Buscar Buses</p>
                <div className="input-container">
                    <AutocompleteInput
                        value={origen}
                        onChange={e => setOrigen(e.target.value)}
                        suggestions={municipios}
                        placeholder="Origen (Ej: Bogotá)"
                    />
                </div>
                <div className="input-container">
                    <AutocompleteInput
                        value={destino}
                        onChange={e => setDestino(e.target.value)}
                        suggestions={municipios}
                        placeholder="Destino (Ej: Medellín)"
                    />
                </div>
                <button className="header-button" type="submit">Buscar</button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>

            {buses.length > 0 && (
                <div style={{ margin: '40px auto', maxWidth: 900 }}>
                    <h3 className="text-lg font-bold mb-4">
                        Buses encontrados para {origenBuscado} → {destinoBuscado}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {buses.map((bus, idx) => {
                            // Siempre calcular el precio con la tarifa y la distancia
                            let precio = 0;
                            if (bus.distancia_km && !isNaN(Number(bus.distancia_km))) {
                                precio = Math.round(Number(bus.distancia_km) * TARIFA_KM);
                                if (precio < 8000) precio = 8000;
                            } else {
                                precio = 15000;
                            }

                            return (
                                <div
                                    key={bus.bus_id || bus.id || idx}
                                    className="bus-card-animada"
                                    style={{
                                        background: 'var(--color-soft)', 
                                        borderRadius: 16,
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                        padding: 18,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        border: '1px solid #e0e0e0',
                                        marginBottom: 18,
                                        maxWidth: 700,
                                        minWidth: 0,
                                        width: '100%'
                                    }}
                                >
                                    {/* Sección con logo y nombre de la empresa */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 120 }}>
                                        <img src="https://static.vecteezy.com/system/resources/previews/046/854/681/non_2x/passenger-bus-isolated-on-transparent-background-free-png.png" alt="Empresa" style={{ width: 60, height: 30, objectFit: 'contain', background: '#fff', borderRadius: 8 }} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{bus.empresa_nombre || 'Empresa'}</div>
                                            <div style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{ color: '#f7b500', fontWeight: 700, fontSize: 14 }}>★</span> 4.5
                                            </div>
                                        </div>
                                    </div>
                                    {/* Sección con horarios y características del bus */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: 18, minWidth: 0 }}>
                                        <div style={{ display: 'flex', gap: 18, marginBottom: 6 }}>
                                            {/* Hora de salida */}
                                            <div>
                                                <div style={{ color: '#888', fontSize: 11 }}>Salida</div>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>
                                                    {bus.salida ? new Date(bus.salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                                {/* Mostrar el origen buscado */}
                                                <div style={{ color: '#555', fontSize: 12 }}>
                                                    {origenBuscado}
                                                </div>
                                            </div>
                                            {/* Hora de llegada */}
                                            <div>
                                                <div style={{ color: '#888', fontSize: 11 }}>Llegada Aprox</div>
                                                <div style={{ fontWeight: 700, fontSize: 16 }}>
                                                    {bus.llegada ? new Date(bus.llegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                                {/* Mostrar el destino buscado */}
                                                <div style={{ color: '#555', fontSize: 12 }}>
                                                    {destinoBuscado}
                                                </div>
                                            </div>
                                        </div>
                                        
                                    
                                    </div>
                                    {/* Precio y acción */}
                                    <div style={{ minWidth: 120, textAlign: 'right' }}>
                                        <div style={{ color: '#888', fontSize: 12, marginBottom: 2 }}>{bus.sillas_disponibles || 17} sillas disponibles</div>
                                        <div style={{ color: '#00b140', fontWeight: 700, fontSize: 18, marginBottom: 2 }}>
                                            ${precio.toLocaleString()}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => navigate('/comprar-ticket', { state: { bus: { ...bus, viaje_id: bus.viaje_id }, ruta: { origen: bus.origen || origen, destino: bus.destino || destino } } })}
                                                className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition"
                                                style={{ fontWeight: 700, fontSize: 14 }}
                                            >
                                                Comprar ticket
                                            </button>
                                            <button
                                                onClick={() => navigate('/mapa', { state: { bus, ruta: { origen: bus.origen || origen, destino: bus.destino || destino }, showBusLocation: true } })}
                                                className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition"
                                                style={{ fontWeight: 700, fontSize: 14 }}
                                            >
                                                Ver Ruta en Mapa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default BuscarBuses;
