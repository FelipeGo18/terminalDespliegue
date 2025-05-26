const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los buses
router.get('/buses', async (req, res) => {
    try {
        db.all('SELECT * FROM buses', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener los buses' });
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los buses' });
    }
});

// Obtener buses cuyo viaje inicia en un municipio intermedio (origen) y termina en el destino final de la ruta
router.get('/buses/origen-destino', async (req, res) => {
    let { origen, destino } = req.query;

    if (!origen || !destino) {
        return res.status(400).json({ error: 'Los parámetros origen y destino son obligatorios' });
    }

    origen = origen.trim();
    destino = destino.trim();

    try {
        db.all(
            `
            SELECT 
                b.id AS bus_id, 
                b.numero_bus, 
                b.conductor, 
                r.origen AS ruta_origen_completa,  -- Renombrado para claridad
                r.destino AS ruta_destino_completa, -- Renombrado para claridad
                e.nombre AS empresa_nombre,
                v.salida,
                v.llegada,
                v.id AS viaje_id,
                r.id AS ruta_id,
                r.distancia_km, -- Esta distancia es de la ruta completa
                v.precio AS precio_fijo,
                b.cat_asientos,
                rm_origen.orden estino.nombre AS municipio_destino_match -- Municipio de destino que coincide con la búsqueda
            FROM buas orden_origen,
                rm_destino.orden as orden_destino,
                m_origen.nombre AS municipio_origen_match, -- Municipio de origen que coincide con la búsqueda
                m_dses b
            JOIN viajes v ON b.id = v.bus_id
            JOIN rutas r ON v.ruta_id = r.id
            JOIN empresas e ON b.empresa_id = e.id
            JOIN ruta_municipios rm_origen ON rm_origen.ruta_id = r.id
            JOIN municipios m_origen ON m_origen.id = rm_origen.municipio_id
            JOIN ruta_municipios rm_destino ON rm_destino.ruta_id = r.id
            JOIN municipios m_destino ON m_destino.id = rm_destino.municipio_id
            WHERE LOWER(TRIM(m_origen.nombre)) = LOWER(?)  -- Comparamos con el municipio de origen de la tabla ruta_municipios
              AND LOWER(TRIM(m_destino.nombre)) = LOWER(?) -- Comparamos con el municipio de destino de la tabla ruta_municipios
              AND rm_origen.orden < rm_destino.orden -- Aseguramos que el origen venga antes que el destino en la ruta
            `,
            [origen, destino],
            async (err, rows) => {
                if (err) {
                    console.error('Error al obtener los buses por origen y destino:', err);
                    return res.status(500).json({ error: 'Error al obtener los buses' });
                }
                // El mensaje de no encontrados se maneja aquí para ser más específico
                // if (rows.length === 0) {
                //     return res.status(404).json({ error: 'No se encontraron buses que pasen por el origen y destino especificados en ese orden.' });
                // }

                const TARIFA_KM = 90; 

                const busesConPrecio = await Promise.all(rows.map(async (row) => {
                    let precio = row.precio_fijo;
                    // La lógica de cálculo de precio podría necesitar ajustarse si la distancia_km 
                    // debe ser entre el origen y destino parcial y no de la ruta completa.
                    // Por ahora, se mantiene usando la distancia_km de la ruta completa si el precio_fijo no es válido.
                    if (
                        precio === undefined ||
                        precio === null ||
                        isNaN(Number(precio)) ||
                        Number(precio) < 1000
                    ) {
                        // Idealmente, aquí se calcularía la distancia entre el m_origen_match y m_destino_match
                        // pero eso requeriría más datos o una función de cálculo de distancia entre puntos de la ruta.
                        // Usamos la distancia total de la ruta como fallback si no hay precio fijo.
                        if (row.distancia_km && !isNaN(Number(row.distancia_km))) {
                            precio = Math.round(Number(row.distancia_km) * TARIFA_KM);
                            if (precio < 8000) precio = 8000;
                        } else {
                            precio = 15000; 
                        }
                    }
                    return { ...row, precio };
                }));
                
                if (busesConPrecio.length === 0) {
                    return res.status(404).json({ error: 'No se encontraron buses que pasen por el origen y destino especificados en ese orden.' });
                }

                res.json(busesConPrecio);
            }
        );
    } catch (error) {
        console.error('Error al obtener los buses por origen y destino:', error);
        res.status(500).json({ error: 'Error al obtener los buses' });
    }
});

// Obtener un bus por ID
router.get('/buses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM buses WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener el bus' });
            } else if (!row) {
                res.status(404).json({ error: 'Bus no encontrado' }); // Aquí se define el mensaje
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el bus' });
    }
});

// Obtener los buses por ruta
router.get('/buses/ruta/:rutaId', async (req, res) => {
    const { rutaId } = req.params;
    try {
        db.all(
            `SELECT b.* 
             FROM buses b 
             JOIN viajes v ON b.id = v.bus_id 
             WHERE v.ruta_id = ?`,
            [rutaId],
            (err, rows) => {
                if (err) {
                    console.error('Error al obtener los buses por ruta:', err);
                    res.status(500).json({ error: 'Error al obtener los buses por ruta' });
                } else {
                    res.json(rows);
                }
            }
        );
    } catch (error) {
        console.error('Error al obtener los buses por ruta:', error);
        res.status(500).json({ error: 'Error al obtener los buses por ruta' });
    }
});

// Crear un nuevo bus
router.post('/buses', async (req, res) => {
    const { numero_bus, conductor, empresa_id, cat_asientos } = req.body;

    try {
        // Verificar si la empresa existe
        db.get('SELECT * FROM empresas WHERE id = ?', [empresa_id], (err, row) => {
            if (err) {
                console.error('Error al verificar la empresa:', err);
                return res.status(500).json({ error: 'Error al verificar la empresa' });
            }
            if (!row) {
                return res.status(400).json({ error: 'La empresa no existe' });
            }

            // Insertar el bus con cat_asientos
            db.run(
                'INSERT INTO buses (numero_bus, conductor, empresa_id, cat_asientos) VALUES (?, ?, ?, ?)',
                [numero_bus, conductor, empresa_id, cat_asientos],
                function (err) {
                    if (err) {
                        console.error('Error al crear el bus:', err);
                        return res.status(500).json({ error: 'Error al crear el bus' });
                    }
                    res.status(201).json({ id: this.lastID, numero_bus, conductor, empresa_id, cat_asientos });
                }
            );
        });
    } catch (error) {
        console.error('Error al crear el bus:', error);
        res.status(500).json({ error: 'Error al crear el bus' });
    }
});

// Actualizar un bus por ID
router.put('/buses/:id', async (req, res) => {
    const { id } = req.params;
    const { numero_bus, conductor, empresa_id, cat_asientos } = req.body;
    try {
        db.run(
            'UPDATE buses SET numero_bus = ?, conductor = ?, empresa_id = ?, cat_asientos = ? WHERE id = ?',
            [numero_bus, conductor, empresa_id, cat_asientos, id],
            function (err) {
                if (err) {
                    res.status(500).json({ error: 'Error al actualizar el bus' });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Bus no encontrado' });
                } else {
                    res.json({ id, numero_bus, conductor, empresa_id, cat_asientos });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el bus' });
    }
});

// Eliminar un bus por ID
router.delete('/buses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.run('DELETE FROM buses WHERE id = ?', [id], function (err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar el bus' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Bus no encontrado' }); // Aquí se define el mensaje
            } else {
                res.json({ message: 'Bus eliminado' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el bus' });
    }
});

// Obtener buses según municipio intermedio (devuelve los buses de la ruta que pasa exactamente por ese municipio)
router.get('/buses/por-municipio', async (req, res) => {
    let { municipio } = req.query;

    if (!municipio) {
        return res.status(400).json({ error: 'El parámetro municipio es obligatorio' });
    }

    municipio = municipio.trim();

    try {
        db.all(
            `
            SELECT 
                b.id AS bus_id, 
                b.numero_bus, 
                b.conductor, 
                r.origen, 
                r.destino,
                e.nombre AS empresa_nombre,
                v.salida,
                v.llegada,
                v.id AS viaje_id,
                r.id AS ruta_id,
                r.distancia_km,
                v.precio AS precio_fijo,
                b.cat_asientos
            FROM buses b
            JOIN viajes v ON b.id = v.bus_id
            JOIN rutas r ON v.ruta_id = r.id
            JOIN empresas e ON b.empresa_id = e.id
            JOIN ruta_municipios rm ON rm.ruta_id = r.id
            JOIN municipios m ON m.id = rm.municipio_id
            WHERE LOWER(TRIM(m.nombre)) = LOWER(?)
            `,
            [municipio],
            async (err, rows) => {
                if (err) {
                    console.error('Error al obtener los buses por municipio:', err);
                    return res.status(500).json({ error: 'Error al obtener los buses' });
                }
                if (rows.length === 0) {
                    return res.status(404).json({ error: 'No se encontraron buses para el municipio especificado' });
                }

                // Calcula el precio si es necesario (igual que antes)
                const busesConPrecio = await Promise.all(rows.map(async (row) => {
                    let precio = row.precio_fijo;
                    if (
                        precio === undefined ||
                        precio === null ||
                        isNaN(Number(precio)) ||
                        Number(precio) < 1000
                    ) {
                        if (row.distancia_km && !isNaN(Number(row.distancia_km))) {
                            precio = Math.round(Number(row.distancia_km) * 120);
                            if (precio < 8000) precio = 8000;
                        } else {
                            precio = 15000;
                        }
                    }
                    return { ...row, precio };
                }));

                res.json(busesConPrecio);
            }
        );
    } catch (error) {
        console.error('Error al obtener los buses por municipio:', error);
        res.status(500).json({ error: 'Error al obtener los buses' });
    }
});

module.exports = router;