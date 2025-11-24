require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());

const rutasMascotas = require('./src/routes/mascotas');
const rutasAdopciones = require('./src/routes/adopciones');
const rutasUsuarios = require('./src/routes/usuarios');
const rutasPublicaciones = require('./src/routes/publicaciones');

app.use('/api/mascotas', rutasMascotas);
app.use('/api/adopciones', rutasAdopciones);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/publicaciones', rutasPublicaciones);

app.get("/", (req, res) => {
  res.send("Backend anda");
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});
