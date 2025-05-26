const express = require('express');
const router = express.Router();
const db = require('../db/conecction');
const { getDistanceKm } = require('../utils/googleDistance');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las rutas
router.get('/rutas', async (req, res) => {
    try {
        db.all(
            `SELECT r.id AS ruta_id, r.origen, r.destino, 
                    e.id AS empresa_id, e.nombre AS empresa_nombre, 
                    b.id AS bus_id, b.numero_bus, b.conductor, b.cat_asientos,
                    v.id AS viaje_id, v.salida, v.llegada, v.precio,
                    (
                        SELECT COUNT(*) FROM tickets t WHERE t.viaje_id = v.id
                    ) AS tickets_ocupados
             FROM rutas r
             LEFT JOIN viajes v ON v.ruta_id = r.id
             LEFT JOIN buses b ON b.id = v.bus_id
             LEFT JOIN empresas e ON e.id = b.empresa_id`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('Error en la consulta SQL:', err);
                    return res.status(500).json({ error: 'Error al obtener las rutas' });
                }
                console.log('Datos obtenidos de la base de datos:', rows);

                const rutas = rows.reduce((acc, row) => {
                    const ruta = acc.find(r => r.ruta_id === row.ruta_id);
                    if (!ruta) {
                        acc.push({
                            ruta_id: row.ruta_id,
                            origen: row.origen,
                            destino: row.destino,
                            empresas: row.empresa_id
                                ? [{
                                    empresa_id: row.empresa_id,
                                    empresa_nombre: row.empresa_nombre,
                                    buses: row.bus_id
                                        ? [{
                                            bus_id: row.bus_id,
                                            numero_bus: row.numero_bus,
                                            conductor: row.conductor,
                                            viaje_id: row.viaje_id,
                                            salida: row.salida,
                                            llegada: row.llegada,
                                            precio: row.precio,
                                            cat_asientos: row.cat_asientos,
                                            sillas_disponibles: row.cat_asientos != null && row.tickets_ocupados != null
                                                ? row.cat_asientos - row.tickets_ocupados
                                                : 17 // fallback
                                        }]
                                        : []
                                }]
                                : []
                        });
                    } else {
                        const empresa = ruta.empresas.find(e => e.empresa_id === row.empresa_id);
                        if (!empresa && row.empresa_id) {
                            ruta.empresas.push({
                                empresa_id: row.empresa_id,
                                empresa_nombre: row.empresa_nombre,
                                buses: row.bus_id
                                    ? [{
                                        bus_id: row.bus_id,
                                        numero_bus: row.numero_bus,
                                        conductor: row.conductor,
                                        viaje_id: row.viaje_id,
                                        salida: row.salida,
                                        llegada: row.llegada,
                                        precio: row.precio,
                                        cat_asientos: row.cat_asientos,
                                        sillas_disponibles: row.cat_asientos != null && row.tickets_ocupados != null
                                            ? row.cat_asientos - row.tickets_ocupados
                                            : 17
                                    }]
                                    : []
                            });
                        } else if (empresa && row.bus_id) {
                            empresa.buses.push({
                                bus_id: row.bus_id,
                                numero_bus: row.numero_bus,
                                conductor: row.conductor,
                                viaje_id: row.viaje_id,
                                salida: row.salida,
                                llegada: row.llegada,
                                precio: row.precio,
                                cat_asientos: row.cat_asientos,
                                sillas_disponibles: row.cat_asientos != null && row.tickets_ocupados != null
                                    ? row.cat_asientos - row.tickets_ocupados
                                    : 17
                            });
                        }
                    }
                    return acc;
                }, []);

                console.log('Rutas procesadas:', rutas);
                res.json(rutas);
            }
        );
    } catch (error) {
        console.error('Error inesperado:', error);
        res.status(500).json({ error: 'Error al obtener las rutas' });
    }
});

// Obtener una ruta por ID
router.get('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM rutas WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener la ruta' });
            } else if (!row) {
                res.status(404).json({ error: 'Ruta no encontrada' });
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la ruta' });
    }
});

// Crear una nueva ruta
router.post('/rutas', async (req, res) => {
    const { origen, destino, duracion_estimada, distancia_km } = req.body;
    try {
        let distanciaFinal = distancia_km;
        // Si no se proporciona distancia_km, la calcula con Google Maps
        if (!distanciaFinal || isNaN(Number(distanciaFinal))) {
            distanciaFinal = await getDistanceKm(origen, destino);
        }
        db.run(
            'INSERT INTO rutas (origen, destino, distancia_km, duracion_estimada) VALUES (?, ?, ?, ?)',
            [origen, destino, distanciaFinal, duracion_estimada],
            function (err) {
                if (err) {
                    res.status(500).json({ error: 'Error al crear la ruta' });
                } else {
                    res.status(201).json({ id: this.lastID, distancia_km: distanciaFinal });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la ruta' });
    }
});

// Actualizar una ruta por ID
router.put('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    const { origen, destino, distancia_km, duracion_estimada } = req.body;
    try {
        db.run(
            'UPDATE rutas SET origen = ?, destino = ?, distancia_km = ?, duracion_estimada = ? WHERE id = ?',
            [origen, destino, distancia_km, duracion_estimada, id],
            function (err) {
                if (err) {
                    res.status(500).json({ error: 'Error al actualizar la ruta' });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Ruta no encontrada' });
                } else {
                    res.json({ message: 'Ruta actualizada' });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la ruta' });
    }
});

// Eliminar una ruta por ID
router.delete('/rutas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run('DELETE FROM rutas WHERE id = ?', [id], function (err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar la ruta' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Ruta no encontrada' });
            } else {
                res.json({ message: 'Ruta eliminada' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la ruta' });
    }
});

// Obtener rutas por empresa
router.get('/rutas/empresa/:empresaId', async (req, res) => {
    const { empresaId } = req.params;
    try {
        db.all(
            `SELECT DISTINCT r.*
             FROM rutas r
             JOIN viajes v ON v.ruta_id = r.id
             JOIN buses b ON v.bus_id = b.id
             WHERE b.empresa_id = ?`,
            [empresaId],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: 'Error al obtener rutas por empresa' });
                } else {
                    res.json(rows);
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener rutas por empresa' });
    }
});

module.exports = router;