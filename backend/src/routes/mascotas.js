const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/estado', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        COALESCE(
          CASE
            WHEN a.estado = 'aceptada' THEN 'Adoptado'
            WHEN a.estado = 'pendiente' THEN 'Pendiente'
            ELSE 'No_Adoptado'
          END,
        'No_Adoptado')  estado_mascota
      FROM mascotas m
      LEFT JOIN LATERAL (
        SELECT estado
        FROM adopciones 
        JOIN publicaciones p ON adopciones.publicacion_id = p.id
        WHERE p.mascota_id = m.id
        ORDER BY 
          estado = 'aceptada' DESC,
          estado = 'pendiente' DESC
        LIMIT 1
      ) a ON true
      ORDER BY m.id;
    `;

    const resultado = await pool.query(query);
    res.json(resultado.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { 
  nombre, 
  especie, 
  raza, 
  edad, 
  tamanio, 
  duenio_id 
  } = req.body;
  raza = raza || 'otro';
  tamanio = tamanio || null;
  if (!nombre || !especie || !edad || !duenio_id) {
    return res.status(400).json({ error: "Campos obligatorios: nombre, especie, edad, duenio_id" });
  }
  
  const query = `
    INSERT INTO mascotas (nombre, especie, raza, edad, tamanio, duenio_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const valores = [nombre, especie, raza, edad, tamanio, duenio_id];

  try {
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23503') {
      return res.status(400).json({ error: "duenio_id no existe" });
    }
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query('DELETE FROM mascotas WHERE id = $1 RETURNING *', [id]);
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }
    res.json({ message: 'Mascota eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;