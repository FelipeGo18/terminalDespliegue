const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los viajes
router.get('/viajes', async (req, res) => {
    try {
        db.all(
            `SELECT v.id, v.salida, v.llegada, v.precio, b.numero_bus, b.conductor, r.origen, r.destino
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('Error al obtener los viajes:', err);
                    return res.status(500).json({ error: 'Error al obtener los viajes' });
                }
                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error al obtener los viajes:', error);
        res.status(500).json({ error: 'Error al obtener los viajes' });
    }
});

// Obtener todos los viajes con información del bus y la ruta
router.get('/viajes-con-bus', async (req, res) => {
    try {
        db.all(
            `SELECT 
                v.id AS viaje_id,
                v.salida,
                v.llegada,
                v.precio,
                v.bus_id,
                v.ruta_id,
                b.numero_bus,
                b.conductor,
                b.cat_asientos,
                r.origen,
                r.destino
            FROM viajes v
            JOIN buses b ON v.bus_id = b.id
            JOIN rutas r ON v.ruta_id = r.id`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('Error al obtener los viajes con bus:', err);
                    return res.status(500).json({ error: 'Error al obtener los viajes con bus' });
                }
                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error al obtener los viajes con bus:', error);
        res.status(500).json({ error: 'Error al obtener los viajes con bus' });
    }
});

// Obtener un viaje por ID
router.get('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get(
            `SELECT v.id, v.salida, v.llegada, b.numero_bus, b.conductor, r.origen, r.destino
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id
             WHERE v.id = ?`,
            [id],
            (err, row) => {
                if (err) {
                    console.error('Error al obtener el viaje:', err);
                    return res.status(500).json({ error: 'Error al obtener el viaje' });
                }
                if (!row) {
                    return res.status(404).json({ error: 'Viaje no encontrado' });
                }
                res.json(row);
            }
        );
    } catch (error) {
        console.error('Error al obtener el viaje:', error);
        res.status(500).json({ error: 'Error al obtener el viaje' });
    }
});

// Obtener los viajes de una ruta específica
router.get('/viajes/ruta/:rutaId', async (req, res) => {
    const { rutaId } = req.params;
    try {
        db.all(
            `SELECT v.id, v.salida, v.llegada, v.precio, v.bus_id, v.ruta_id
             FROM viajes v
             WHERE v.ruta_id = ?`,
            [rutaId],
            (err, rows) => {
                if (err) {
                    console.error('Error al obtener los viajes por ruta:', err);
                    return res.status(500).json({ error: 'Error al obtener los viajes por ruta' });
                }
                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error al obtener los viajes por ruta:', error);
        res.status(500).json({ error: 'Error al obtener los viajes por ruta' });
    }
});

// Obtener los viajes de una empresa específica
router.get('/viajes/empresa/:empresaId', async (req, res) => {
    const { empresaId } = req.params;
    try {
        db.all(
            `SELECT v.id, v.salida, v.llegada, v.precio, b.numero_bus, b.conductor, r.origen, r.destino
             FROM viajes v
             JOIN buses b ON v.bus_id = b.id
             JOIN rutas r ON v.ruta_id = r.id
             WHERE b.empresa_id = ?`,
            [empresaId],
            (err, rows) => {
                if (err) {
                    console.error('Error al obtener los viajes por empresa:', err);
                    return res.status(500).json({ error: 'Error al obtener los viajes por empresa' });
                }
                res.json(rows);
            }
        );
    } catch (error) {
        console.error('Error al obtener los viajes por empresa:', error);
        res.status(500).json({ error: 'Error al obtener los viajes por empresa' });
    }
});

// Crear un nuevo viaje (precio fijo para ruta principal)
router.post('/viajes', async (req, res) => {
    const { bus_id, ruta_id, salida, llegada, precio } = req.body;

    try {
        // Verificar si el bus existe
        const busResult = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM buses WHERE id = ?', [bus_id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!busResult) {
            return res.status(400).json({ error: 'El bus no existe' });
        }

        // Verificar si la ruta existe y obtener datos
        const rutaResult = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM rutas WHERE id = ?', [ruta_id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!rutaResult) {
            return res.status(400).json({ error: 'La ruta no existe' });
        }

        // Si el precio viene en el body, úsalo (precio fijo de la ruta principal)
        let precioFinal = precio;
        if (precioFinal === undefined || precioFinal === null || isNaN(Number(precioFinal))) {
            // Si no viene, intenta calcularlo como antes (para compatibilidad)
            // Busca el municipio de origen
            const municipioOrigen = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM municipios WHERE nombre = ?', [rutaResult.origen], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            if (!municipioOrigen) {
                return res.status(400).json({ error: 'No se encontró el municipio de origen para la tarifa' });
            }

            const tarifaKm = municipioOrigen.tarifa_km;
            const distancia = rutaResult.distancia_km;
            precioFinal = distancia * tarifaKm;
        }

        db.run(
            'INSERT INTO viajes (bus_id, ruta_id, salida, llegada, precio) VALUES (?, ?, ?, ?, ?)',
            [bus_id, ruta_id, salida, llegada, precioFinal],
            function (err) {
                if (err) {
                    console.error('Error al crear el viaje:', err);
                    return res.status(500).json({ error: 'Error al crear el viaje' });
                }
                res.status(201).json({ id: this.lastID, bus_id, ruta_id, salida, llegada, precio: precioFinal });
            }
        );
    } catch (error) {
        console.error('Error al crear el viaje:', error);
        res.status(500).json({ error: 'Error al crear el viaje' });
    }
});

// Calcular precio de un tramo intermedio (no crea viaje, solo devuelve el precio)
router.post('/viajes/tramo', async (req, res) => {
    const { ruta_id, origen_municipio, destino_municipio } = req.body;
    try {
        // 1. Obtener orden de origen y destino en la ruta
        const ordenes = await new Promise((resolve, reject) => {
            db.all(
                `SELECT rm.orden, m.nombre
                 FROM ruta_municipios rm
                 JOIN municipios m ON m.id = rm.municipio_id
                 WHERE rm.ruta_id = ? AND (LOWER(TRIM(m.nombre)) = LOWER(?) OR LOWER(TRIM(m.nombre)) = LOWER(?))
                 ORDER BY rm.orden ASC`,
                [ruta_id, origen_municipio, destino_municipio],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        if (!ordenes || ordenes.length < 2) {
            return res.status(400).json({ error: 'No se encontraron ambos municipios en la ruta' });
        }

        const ordenOrigen = ordenes.find(o => o.nombre.toLowerCase().trim() === origen_municipio.toLowerCase().trim());
        const ordenDestino = ordenes.find(o => o.nombre.toLowerCase().trim() === destino_municipio.toLowerCase().trim());

        // 2. Obtener municipios intermedios
        const municipiosTramo = await new Promise((resolve, reject) => {
            db.all(
                `SELECT m.*, rm.orden
                 FROM ruta_municipios rm
                 JOIN municipios m ON m.id = rm.municipio_id
                 WHERE rm.ruta_id = ?
                   AND rm.orden >= ?
                   AND rm.orden <= ?
                 ORDER BY rm.orden ASC`,
                [
                    ruta_id,
                    Math.min(ordenOrigen.orden, ordenDestino.orden),
                    Math.max(ordenOrigen.orden, ordenDestino.orden)
                ],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        // 3. Calcular distancia proporcional
        const rutaResult = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM rutas WHERE id = ?', [ruta_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const totalMunicipiosRuta = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as total FROM ruta_municipios WHERE ruta_id = ?`,
                [ruta_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.total);
                }
            );
        });

        const tramos = municipiosTramo.length - 1;
        const distanciaTramo = (rutaResult.distancia_km && totalMunicipiosRuta > 1)
            ? (rutaResult.distancia_km * tramos) / (totalMunicipiosRuta - 1)
            : 0;

        // 4. Tarifa del municipio de origen
        const municipioOrigen = await new Promise((resolve, reject) => {
            db.get(
                'SELECT tarifa_km FROM municipios WHERE LOWER(TRIM(nombre)) = LOWER(?)',
                [origen_municipio],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!municipioOrigen) {
            return res.status(400).json({ error: 'No se encontró el municipio de origen para la tarifa' });
        }

        // 5. Calcular precio
        const precio = Math.round(Number(distanciaTramo) * Number(municipioOrigen.tarifa_km));
        res.json({ precio, distancia_km: distanciaTramo });
    } catch (error) {
        res.status(500).json({ error: 'Error al calcular el precio del tramo' });
    }
});

// Actualizar un viaje por ID
router.put('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    const { bus_id, ruta_id, salida, llegada, precio } = req.body;
    try {
        // Verifica que el viaje exista
        const viajeExistente = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM viajes WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (!viajeExistente) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // Si no viene precio, recalcula automáticamente
        let precioFinal = precio;
        if (precioFinal === undefined || precioFinal === null || isNaN(Number(precioFinal))) {
            // Busca la ruta y municipio de origen
            const rutaResult = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM rutas WHERE id = ?', [ruta_id], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
            const municipioOrigen = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM municipios WHERE nombre = ?', [rutaResult.origen], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });
            if (!municipioOrigen) {
                return res.status(400).json({ error: 'No se encontró el municipio de origen para la tarifa' });
            }
            const tarifaKm = municipioOrigen.tarifa_km;
            const distancia = rutaResult.distancia_km;
            precioFinal = distancia * tarifaKm;
        }

        db.run(
            'UPDATE viajes SET bus_id = ?, ruta_id = ?, salida = ?, llegada = ?, precio = ? WHERE id = ?',
            [bus_id, ruta_id, salida, llegada, precioFinal, id],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al actualizar el viaje' });
                } else if (this.changes === 0) {
                    return res.status(404).json({ error: 'Viaje no encontrado' });
                } else {
                    res.json({ id, bus_id, ruta_id, salida, llegada, precio: precioFinal });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el viaje' });
    }
});

// Eliminar un viaje por ID
router.delete('/viajes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run(
            'DELETE FROM viajes WHERE id = ?',
            [id],
            function (err) {
                if (err) {
                    console.error('Error al eliminar el viaje:', err);
                    return res.status(500).json({ error: 'Error al eliminar el viaje' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Viaje no encontrado' });
                }
                res.status(200).json({ message: 'Viaje eliminado correctamente' });
            }
        );
    } catch (error) {
        console.error('Error al eliminar el viaje:', error);
        res.status(500).json({ error: 'Error al eliminar el viaje' });
    }
});

module.exports = router;