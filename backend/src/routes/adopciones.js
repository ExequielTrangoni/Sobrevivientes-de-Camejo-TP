const express = require('express');
const router = express.Router();
const pool = require('../db');
const estadosPermitidos = ['pendiente', 'aceptada', 'rechazada'];

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM adopciones ORDER BY fecha_solicitud DESC');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  let { 
    estado, 
    mensaje_solicitud, 
    descripcion,
    requisitos, 
    publicacion_id, 
    adoptante_id 
  } = req.body;
  if (estado) {
    estado = estado.toLowerCase();
  } else {
    estado = 'pendiente';
  }
  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  if (!publicacion_id || !adoptante_id) {
    return res.status(400).json({ error: "publicacion_id y adoptante_id son obligatorios" });
  }

  const query = `
    INSERT INTO adopciones ( 
      estado, 
      mensaje_solicitud, 
      descripcion,
      requisitos, 
      publicacion_id, 
      adoptante_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const valores = [
    estado,
    mensaje_solicitud || null, 
    descripcion || null,
    requisitos || null, 
    publicacion_id, 
    adoptante_id
  ];

  try {
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(400).json({ error: "publicacion_id o adoptante_id no existen" });
    }
    res.status(500).json({ error: 'Error al crear la adopción' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const resultado = await pool.query('DELETE FROM adopciones WHERE id = $1 RETURNING *', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "Adopción no encontrada" });
    }
    
    res.json({ mensaje: 'Adopción eliminada correctamente', adopcion: resQuery.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;