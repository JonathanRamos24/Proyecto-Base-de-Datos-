const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'TraficSecure1' // Cambiado al nombre correcto
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL - TraficSecure1');
});

// ===================
// RUTAS PRINCIPALES
// ===================

// Obtener todas las zonas (con coordenadas)
app.get('/zonas', (req, res) => {
  const query = `
    SELECT 
      id_zona,
      nombre,
      ST_X(coordenadas) as lng,
      ST_Y(coordenadas) as lat,
      nivel_riesgo
    FROM Zona
    ORDER BY id_zona
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener zonas:', err);
      return res.status(500).json({ error: 'Error al obtener zonas' });
    }
    res.json(results);
  });
});

// Obtener todos los eventos
app.get('/eventos', (req, res) => {
  const query = `
    SELECT 
      e.id_evento,
      e.tipo_evento,
      e.descripcion,
      e.fecha,
      e.hora,
      e.id_zona,
      z.nombre as zona_nombre,
      ST_X(z.coordenadas) as lng,
      ST_Y(z.coordenadas) as lat,
      e.id_usuario_operador
    FROM Evento_Trafico e
    INNER JOIN Zona z ON e.id_zona = z.id_zona
    ORDER BY e.fecha DESC, e.hora DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener eventos:', err);
      return res.status(500).json({ error: 'Error al obtener eventos' });
    }
    res.json(results);
  });
});

// Registrar evento de tráfico
app.post('/eventos', (req, res) => {
  const { tipo_evento, descripcion, fecha, hora, id_zona, id_usuario_operador } = req.body;

  // Validar campos requeridos
  if (!tipo_evento || !fecha || !hora || !id_zona) {
    return res.status(400).json({
      error: 'Los campos tipo_evento, fecha, hora e id_zona son requeridos'
    });
  }

  // Verificar que el tipo_evento sea válido según tu ENUM
  const tiposPermitidos = ['congestion', 'cierre', 'desvio', 'lento'];
  if (!tiposPermitidos.includes(tipo_evento)) {
    return res.status(400).json({
      error: `Tipo de evento no válido. Debe ser: ${tiposPermitidos.join(', ')}`
    });
  }

  const query = `
    INSERT INTO Evento_Trafico 
    (tipo_evento, descripcion, fecha, hora, id_zona, id_usuario_operador) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    tipo_evento, 
    descripcion || '', 
    fecha, 
    hora, 
    id_zona, 
    id_usuario_operador || 2 // Operador por defecto
  ], (err, result) => {
    if (err) {
      console.error('Error al guardar evento:', err);
      return res.status(500).json({ 
        error: 'Error al guardar el evento', 
        details: err.message 
      });
    }
    
    res.status(201).json({ 
      message: 'Evento registrado exitosamente',
      id: result.insertId 
    });
  });
});

// Registrar accidente
app.post('/accidentes', (req, res) => {
  const { tipo, gravedad, causa, fecha, hora, id_zona } = req.body;

  // Validar campos requeridos
  if (!tipo || !gravedad || !fecha || !hora || !id_zona) {
    return res.status(400).json({
      error: 'Los campos tipo, gravedad, fecha, hora e id_zona son requeridos'
    });
  }

  // Verificar valores válidos según tu ENUM
  const tiposPermitidos = ['colisión', 'atropello', 'volcamiento', 'otro'];
  const gravedadesPermitidas = ['leve', 'moderado', 'grave', 'fatal'];
  
  if (!tiposPermitidos.includes(tipo)) {
    return res.status(400).json({
      error: `Tipo de accidente no válido. Debe ser: ${tiposPermitidos.join(', ')}`
    });
  }
  
  if (!gravedadesPermitidas.includes(gravedad)) {
    return res.status(400).json({
      error: `Gravedad no válida. Debe ser: ${gravedadesPermitidas.join(', ')}`
    });
  }

  const query = `
    INSERT INTO Accidente 
    (tipo, gravedad, causa, fecha, hora, id_zona) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [tipo, gravedad, causa || '', fecha, hora, id_zona], (err, result) => {
    if (err) {
      console.error('Error al guardar accidente:', err);
      return res.status(500).json({ 
        error: 'Error al guardar el accidente', 
        details: err.message 
      });
    }
    
    res.status(201).json({ 
      message: 'Accidente registrado exitosamente',
      id: result.insertId 
    });
  });
});

// Obtener accidentes
app.get('/accidentes', (req, res) => {
  const query = `
    SELECT 
      a.id_accidente,
      a.tipo,
      a.gravedad,
      a.causa,
      a.fecha,
      a.hora,
      a.id_zona,
      z.nombre as zona_nombre
    FROM Accidente a
    INNER JOIN Zona z ON a.id_zona = z.id_zona
    ORDER BY a.fecha DESC, a.hora DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener accidentes:', err);
      return res.status(500).json({ error: 'Error al obtener accidentes' });
    }
    res.json(results);
  });
});

// Registrar clima
app.post('/clima', (req, res) => {
  const { temperatura, humedad, visibilidad, condicion, fecha, hora, id_zona, id_usuario_operador } = req.body;

  // Validar campos requeridos
  if (!condicion || !fecha || !hora || !id_zona) {
    return res.status(400).json({
      error: 'Los campos condicion, fecha, hora e id_zona son requeridos'
    });
  }

  // Verificar condición válida según tu ENUM
  const condicionesPermitidas = ['soleado', 'nublado', 'lluvia', 'niebla', 'tormenta'];
  if (!condicionesPermitidas.includes(condicion)) {
    return res.status(400).json({
      error: `Condición no válida. Debe ser: ${condicionesPermitidas.join(', ')}`
    });
  }

  const query = `
    INSERT INTO Clima 
    (temperatura, humedad, visibilidad, condicion, fecha, hora, id_zona, id_usuario_operador) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    temperatura || null, 
    humedad || null, 
    visibilidad || null, 
    condicion, 
    fecha, 
    hora, 
    id_zona, 
    id_usuario_operador || 2 // Operador por defecto
  ], (err, result) => {
    if (err) {
      console.error('Error al guardar clima:', err);
      return res.status(500).json({ 
        error: 'Error al guardar datos climáticos', 
        details: err.message 
      });
    }
    
    res.status(201).json({ 
      message: 'Datos climáticos registrados exitosamente',
      id: result.insertId 
    });
  });
});

// Obtener datos climáticos
app.get('/clima', (req, res) => {
  const query = `
    SELECT 
      c.id_clima,
      c.temperatura,
      c.humedad,
      c.visibilidad,
      c.condicion,
      c.fecha,
      c.hora,
      c.id_zona,
      z.nombre as zona_nombre
    FROM Clima c
    INNER JOIN Zona z ON c.id_zona = z.id_zona
    ORDER BY c.fecha DESC, c.hora DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener datos climáticos:', err);
      return res.status(500).json({ error: 'Error al obtener datos climáticos' });
    }
    res.json(results);
  });
});

// Obtener sensores
app.get('/sensores', (req, res) => {
  const query = `
    SELECT 
      s.id_sensor,
      s.tipo_sensor,
      s.estado,
      s.id_zona,
      z.nombre as zona_nombre,
      ST_X(z.coordenadas) as lng,
      ST_Y(z.coordenadas) as lat
    FROM Sensor s
    INNER JOIN Zona z ON s.id_zona = z.id_zona
    ORDER BY s.id_sensor
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener sensores:', err);
      return res.status(500).json({ error: 'Error al obtener sensores' });
    }
    res.json(results);
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '¡Servidor TraficSecure funcionando!',
    database: 'TraficSecure1',
    endpoints: ['/zonas', '/eventos', '/accidentes', '/clima', '/sensores']
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor TraficSecure corriendo en http://localhost:${port}`);
  console.log(`📊 Base de datos: TraficSecure1`);
});