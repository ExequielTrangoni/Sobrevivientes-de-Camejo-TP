const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) 
    }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, p.titulo, p.descripcion, p.fecha_publicacion, p.ubicacion, p.imagen_publicacion,
        m.nombre AS nombre_mascota,
        m.especie,
        u.nombre_completo AS nombre_usuario
      FROM publicaciones p
      JOIN mascotas m ON p.mascota_id = m.id
      JOIN usuarios u ON m.duenio_id = u.id
      ORDER BY p.id DESC
    `;
    
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

router.post('/', upload.single('imagen_publicacion'), async (req, res) => {
  const { titulo, descripcion, ubicacion, mascota_id } = req.body;
  
  const imagen_publicacion = req.file ? req.file.filename : null;

  const query = `
    INSERT INTO publicaciones (titulo, descripcion, ubicacion, imagen_publicacion, mascota_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const valores = [titulo, descripcion, ubicacion, imagen_publicacion, parseInt(mascota_id)];

  try {
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM publicaciones WHERE id = $1';
    await pool.query(query, [id]);
    res.json({ mensaje: 'Publicacion eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/like/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'UPDATE publicaciones SET likes = likes + 1 WHERE id = $1 RETURNING *';
    const resultado = await pool.query(query, [id]);
    
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;