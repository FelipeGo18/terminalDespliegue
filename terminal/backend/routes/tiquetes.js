const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todos los tickets
router.get('/tickets', async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM tickets', (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los tickets' });
    }
});

// Obtener un ticket por ID
router.get('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM tickets WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (!result) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el ticket' });
    }
});

// Crear un nuevo ticket con detalles
router.post('/tickets', async (req, res) => {
    const { usuario_id, viaje_id, asiento } = req.body;

    console.log('Datos recibidos en el servidor:', { usuario_id, viaje_id, asiento }); // Depuración

    try {
        // Verificar existencia del usuario
        const usuarioResult = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM usuarios WHERE id = ?', [usuario_id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (!usuarioResult) return res.status(400).json({ error: 'El usuario no existe' });

        // Verificar existencia del viaje y obtener bus_id
        const viajeResult = await new Promise((resolve, reject) => {
            db.get(
                `SELECT v.*, r.origen, r.destino, b.numero_bus, b.conductor, b.cat_asientos, e.nombre AS empresa_nombre, v.precio
                 FROM viajes v
                 JOIN rutas r ON v.ruta_id = r.id
                 JOIN buses b ON v.bus_id = b.id
                 JOIN empresas e ON b.empresa_id = e.id
                 WHERE v.id = ?`,
                [viaje_id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
        if (!viajeResult) return res.status(400).json({ error: 'El viaje no existe' });

        // Verificar si el asiento ya está ocupado
        const asientoResult = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM tickets WHERE viaje_id = ? AND asiento = ?',
                [viaje_id, asiento],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });
        if (asientoResult) return res.status(400).json({ error: 'Ese asiento ya está ocupado para este viaje' });

        // Verificar si el bus está lleno
        const totalOcupados = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as total FROM tickets WHERE viaje_id = ?',
                [viaje_id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row.total);
                }
            );
        });
        if (totalOcupados >= viajeResult.cat_asientos) {
            return res.status(400).json({ error: 'El bus está lleno, no hay asientos disponibles' });
        }

        // Crear el ticket
        const ticketInsert = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO tickets (usuario_id, viaje_id, asiento, fecha_compra)
                 VALUES (?, ?, ?, datetime('now'))`,
                [usuario_id, viaje_id, asiento],
                function (err) {
                    if (err) reject(err);
                    resolve({ id: this.lastID });
                }
            );
        });

        const responseData = {
            id: ticketInsert.id,
            nombre: usuarioResult.nombre,
            origen: viajeResult.origen,
            destino: viajeResult.destino,
            salida: viajeResult.salida,
            llegada: viajeResult.llegada,
            numero_bus: viajeResult.numero_bus,
            conductor: viajeResult.conductor,
            empresa: viajeResult.empresa_nombre,
            asiento,
            fecha: new Date().toISOString(),
            precio: viajeResult.precio
        };

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error al crear el ticket:', error);
        res.status(500).json({ error: 'Error al crear el ticket' });
    }
});

// Actualizar un ticket por ID
router.put('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id, viaje_id, asiento, fecha_compra } = req.body;
    try {
        const result = await new Promise((resolve, reject) => {
            db.run(
                'UPDATE tickets SET usuario_id = ?, viaje_id = ?, asiento = ?, fecha_compra = ? WHERE id = ?',
                [usuario_id, viaje_id, asiento, fecha_compra, id],
                function (err) {
                    if (err) reject(err);
                    resolve({ changes: this.changes });
                }
            );
        });
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json({ message: 'Ticket actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el ticket' });
    }
});

// Eliminar un ticket por ID
router.delete('/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM tickets WHERE id = ?', [id], function (err) {
                if (err) reject(err);
                resolve({ changes: this.changes });
            });
        });
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }
        res.json({ message: 'Ticket eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el ticket' });
    }
});

module.exports = router;
