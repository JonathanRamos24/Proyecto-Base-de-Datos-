// db.js
const mysql = require('mysql2');

// Crea la conexión con la base de datos MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // tu usuario de MySQL
  password: 'david24.24', // tu contraseña de MySQL (si no tienes, déjalo vacío)
  database: 'TraficSecure1' // el nombre de tu base de datos
});

// Verifica la conexión
connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

module.exports = connection;
