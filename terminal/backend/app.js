const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*', // Ajusta según tus necesidades de seguridad
    methods: ['GET', 'POST']
  }
});

// Importar rutas
const rutas = require('./routes/rutas');
const viajes = require('./routes/viajes');
const usuarios = require('./routes/usuarios');
const tiquetes = require('./routes/tiquetes');
const roles = require('./routes/roles');
const municipios = require('./routes/municipios');
const empresas = require('./routes/empresas');
const buses = require('./routes/buses');
const rutasMunicipio = require('./routes/rutas_municipio');

// Middlewares
app.use(cors({ origin: ['http://localhost:10301', 'http://localhost:5000'] })); // Permitir múltiples orígenes
app.use(express.json()); // Para poder leer JSON en las peticiones

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  jwt.verify(token, 'SECRET_KEY', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Registrar rutas con prefijo /api
app.use('/api/', rutas);
app.use('/api/', viajes);
app.use('/api/', usuarios);
app.use('/api/', tiquetes);
app.use('/api/', roles);
app.use('/api/', municipios);
app.use('/api/', empresas);
app.use('/api/', buses);
app.use('/api/', rutasMunicipio);

// Ejemplo de uso del middleware en una ruta protegida
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Acceso autorizado', user: req.user });
});

// Mapa para almacenar la última ubicación de cada bus y el tiempo de expiración
const busLocations = {}; // { [busId]: { lat, lng, timestamp, expiresAt } }

// Manejo de conexiones socket.io
io.on('connection', (socket) => {
  // Cliente se une a la sala de un bus específico
  socket.on('joinBus', (busId) => {
    socket.join(`bus_${busId}`);
    // Si ya hay ubicación y no ha expirado, envíala al nuevo cliente
    const loc = busLocations[busId];
    if (loc && loc.expiresAt > Date.now()) {
      socket.emit('busLocation', { busId, lat: loc.lat, lng: loc.lng, timestamp: loc.timestamp });
    }
  });

  // Recibe actualización de ubicación de un bus (solo válida por 5 minutos)
  socket.on('updateBusLocation', ({ busId, lat, lng }) => {
    const now = Date.now();
    busLocations[busId] = {
      lat,
      lng,
      timestamp: now,
      expiresAt: now + 5 * 60 * 1000 // 5 minutos
    };
    // Notifica a todos los clientes suscritos a ese bus
    io.to(`bus_${busId}`).emit('busLocation', { busId, lat, lng, timestamp: now });
  });

  // Cliente abandona la sala de un bus
  socket.on('leaveBus', (busId) => {
    socket.leave(`bus_${busId}`);
  });
});

// Limpieza periódica de ubicaciones expiradas
setInterval(() => {
  const now = Date.now();
  for (const busId in busLocations) {
    if (busLocations[busId].expiresAt <= now) {
      delete busLocations[busId];
    }
  }
}, 60 * 1000); // Cada minuto

// Puerto
const PORT = 4004;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
  console.log(`Socket.io corriendo en el mismo puerto`);
});
