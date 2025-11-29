const express = require('express');
const router = express.Router();
const pool = require('../db');
const autenticar = require('../middlewares/autor');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  let { 
  nombre, 
  especie, 
  raza, 
  edad, 
  tamanio,
  imagen_mascota, 
  } = req.body;
  
  const query = `
    INSERT INTO mascotas (nombre, especie, raza, edad, tamanio, duenio_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const valores = [nombre, especie, raza, edad, tamanio, duenio_id];

  if (!nombre || !especie || !edad || !duenio_id) {
    return res.status(400).json({ error: "Campos obligatorios: nombre, especie, edad, duenio_id" });
  }
  
  raza = raza || 'otro';
  tamanio = tamanio || null;
  imagen_mascota = imagen_mascota || null;
  
  const duenio_id = req.user.id;
  
  try {
    const queryMascota = `
      INSERT INTO mascotas (nombre, especie, raza, edad, tamanio, imagen_mascota, duenio_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const valoresMascota = [nombre, especie, raza, edad, tamanio, imagen_mascota, duenio_id];
    const resultadoMascota = await pool.query(queryMascota, valoresMascota);

    res.status(201).json(resultadoMascota.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  try {
    const mascota = await pool.query('SELECT * FROM mascotas WHERE id = $1', [id]);
    if (mascota.rowCount === 0) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    if (mascota.rows[0].duenio_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado: solo el dueño puede eliminar la mascota' });
    }

    const resultado = await pool.query('DELETE FROM mascotas WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Mascota eliminada correctamente', mascota: resultado.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;