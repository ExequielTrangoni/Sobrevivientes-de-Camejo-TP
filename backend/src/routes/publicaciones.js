const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, p.titulo, p.descripcion, p.fecha_publicacion, p.ubicacion,
        m.nombre AS nombre_mascota,
        m.especie,
        u.nombre AS nombre_usuario
      FROM publicaciones p
      JOIN mascotas m ON p.mascota_id = m.id
      JOIN usuarios u ON m.duenio_id = u.id
      ORDER BY p.fecha_publicacion DESC
    `;
    
    const resultado = await pool.query(query);
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

});

router.post('/', async (req, res) => {
  const { titulo, descripcion, ubicacion, mascota_id } = req.body;

  const query = `
    INSERT INTO publicaciones (titulo, descripcion, ubicacion, mascota_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const valores = [titulo, descripcion, ubicacion, mascota_id];

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