const express = require('express');
const router = express.Router();
const pool = require('../db');
const autenticar = require('../middlewares/autor');
const path = require('path');
const autenticar = require('../middlewares/autor');
const upload = require('../middlewares/upload');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', autenticar, upload.single('imagen_mascota'), async (req, res) => {
    try {
        const { mascotaNombre, mascotaEspecie, mascotaEdad, mascotaRaza, mascotaTamanio } = req.body;
        const duenio_id = req.user.id;
        if (!mascotaNombre) return res.status(400).json({ error: 'Nombre es obligatorio' });

        const imagen_mascota = req.file ? req.file.filename : null;

        const resultado = await pool.query(
            `INSERT INTO mascotas (nombre, especie, edad, raza, tamanio, imagen_mascota, duenio_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [mascotaNombre, mascotaEspecie, mascotaEdad, mascotaRaza, mascotaTamanio, imagen_mascota,duenio_id]
        );

        res.json(resultado.rows[0]);
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

router.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const consulta = 'SELECT * FROM mascotas WHERE duenio_id = $1';
    const resultado = await pool.query(consulta, [id]);
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

router.get('/mis-mascotas', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM mascotas WHERE duenio_id = $1',
      [req.user.id]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mascotas' });
  }
});
