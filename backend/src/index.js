require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());

const rutasMascotas = require('./routes/mascotas');
const rutasAdopciones = require('./routes/adopciones');

app.use('/api/mascotas', rutasMascotas);
app.use('/api/adopciones', rutasAdopciones);

app.get("/", (req, res) => {
  res.send("Backend anda");
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000");
});
