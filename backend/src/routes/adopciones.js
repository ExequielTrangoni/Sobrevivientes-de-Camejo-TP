const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM adopciones');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { 
    fecha_solicitud, 
    estado, 
    mensaje_solicitud, 
    notas_adicionales, 
    publicacion_id, 
    adoptante_id 
  } = req.body;

  const query = `
    INSERT INTO adopciones (
      fecha_solicitud, 
      estado, 
      mensaje_solicitud, 
      notas_adicionales, 
      publicacion_id, 
      adoptante_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const valores = [
    fecha_solicitud || new Date(),
    estado || 'Pendiente',
    mensaje_solicitud, 
    notas_adicionales, 
    publicacion_id, 
    adoptante_id
  ];

  try {
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la adopción' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = 'DELETE FROM adopciones WHERE id = $1';
    await pool.query(query, [id]);
    
    res.json({ mensaje: 'Adopción eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;