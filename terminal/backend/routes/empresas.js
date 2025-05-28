const express = require('express');
const router = express.Router();
const db = require('../db/conecction');

router.use(express.json()); // Middleware para parsear JSON

// Obtener todas las empresas
router.get('/empresas', async (req, res) => {
    try {
        db.all('SELECT * FROM empresas', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener las empresas' });
            } else {
                res.json(rows);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las empresas' });
    }
});

// Obtener una empresa por ID
router.get('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error al obtener la empresa' });
            } else if (!row) {
                res.status(404).json({ error: 'Empresa no encontrada' });
            } else {
                res.json(row);
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la empresa' });
    }
});

// Crear una nueva empresa
router.post('/empresas', async (req, res) => {
    const { nombre } = req.body;
    try {
        db.run('INSERT INTO empresas (nombre) VALUES (?)', [nombre], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al crear la empresa' });
            } else {
                res.status(201).json({ id: this.lastID, nombre });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la empresa' });
    }
});

// Actualizar una empresa por ID
router.put('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        db.run('UPDATE empresas SET nombre = ? WHERE id = ?', [nombre, id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al actualizar la empresa' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Empresa no encontrada' });
            } else {
                res.json({ id, nombre });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la empresa' });
    }
});

// Eliminar una empresa por ID
router.delete('/empresas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Borrar todos los viajes de los buses de la empresa
        await new Promise((resolve, reject) => {
            // Busca todos los buses de la empresa
            db.all('SELECT id FROM buses WHERE empresa_id = ?', [id], async (err, busesRows) => {
                if (err) return reject(err);

                // Borra todos los viajes de esos buses
                for (const bus of busesRows) {
                    await new Promise((res2, rej2) => {
                        db.run('DELETE FROM viajes WHERE bus_id = ?', [bus.id], function (err2) {
                            if (err2) rej2(err2);
                            else res2();
                        });
                    });
                }

                // Borra todos los buses de la empresa
                for (const bus of busesRows) {
                    await new Promise((res2, rej2) => {
                        db.run('DELETE FROM buses WHERE id = ?', [bus.id], function (err2) {
                            if (err2) rej2(err2);
                            else res2();
                        });
                    });
                }

                resolve();
            });
        });

        // 2. Borra rutas huérfanas (sin viajes)
        await new Promise((resolve, reject) => {
            db.all('SELECT id FROM rutas', [], async (err, rutasRows) => {
                if (err) return reject(err);

                for (const ruta of rutasRows) {
                    await new Promise((res2, rej2) => {
                        db.get('SELECT COUNT(*) as total FROM viajes WHERE ruta_id = ?', [ruta.id], (err2, row) => {
                            if (err2) rej2(err2);
                            else {
                                if (row.total === 0) {
                                    db.run('DELETE FROM rutas WHERE id = ?', [ruta.id], function (err3) {
                                        if (err3) rej2(err3);
                                        else res2();
                                    });
                                } else {
                                    res2();
                                }
                            }
                        });
                    });
                }
                resolve();
            });
        });

        // 3. Borra la empresa
        db.run('DELETE FROM empresas WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: 'Error al eliminar la empresa' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Empresa no encontrada' });
            } else {
                res.json({ message: 'Empresa y datos relacionados eliminados' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la empresa y sus datos relacionados' });
    }
});

module.exports = router;