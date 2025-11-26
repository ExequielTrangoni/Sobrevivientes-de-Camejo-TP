const express = require('express');
const router = express.Router();
const pool = require('../db');
const autenticar = require('../middlewares/autor');

router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        pa.id AS publicacion_adopciones_id,
        pa.titulo,
        pa.descripcion,
        pa.requisitos,
        pa.imagen_publicacion,
        pa.estado_mascota,
        m.id AS mascota_id,
        m.nombre AS nombre_mascota,
        m.edad,
        m.raza,
        m.tamanio,
        m.imagen_mascota,
        m.especie,
        m.duenio_id AS usuario_id
      FROM publicaciones_adopciones pa
      JOIN mascotas m ON pa.mascota_id = m.id
      ORDER BY (pa.estado_mascota = 'adoptado') ASC, pa.fecha_publicacion DESC
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener publicaciones de adopciones' });
  }
});

router.get('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(`
      SELECT 
        pa.id AS publicacion_adopciones_id,
        pa.titulo,
        pa.descripcion,
        pa.requisitos,
        pa.imagen_publicacion,
        m.id AS mascota_id,
        m.nombre AS nombre_mascota,
        m.edad,
        m.raza,
        m.tamanio,
        m.imagen_mascota,
        u.id AS usuario_id,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.imagen_usuario,
        u.direccion
      FROM publicaciones_adopciones pa
      JOIN mascotas m ON pa.mascota_id = m.id
      JOIN usuarios u ON m.duenio_id = u.id
      WHERE pa.id = $1
    `, [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Publicación de adopción no encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener detalle de publicación de adopción' });
  }
});

router.post('/', autenticar, async (req, res) => {
  const { mascota_id, titulo, descripcion, requisitos, imagen_publicacion } = req.body;
  if (!mascota_id || !titulo) {
    return res.status(400).json({ error: "Campos obligatorios: mascota_id y titulo" });
  }

  try {
    const mascota = await pool.query('SELECT duenio_id FROM mascotas WHERE id = $1', [mascota_id]);
    if (mascota.rowCount === 0) return res.status(404).json({ error: 'Mascota no encontrada' });
    if (mascota.rows[0].duenio_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado: solo el dueño puede publicar esta mascota' });
    }
    const query = `
      INSERT INTO publicaciones_adopciones 
        (mascota_id, titulo, descripcion, requisitos, imagen_publicacion, estado_mascota)
      VALUES ($1, $2, $3, $4, $5, 'no-adoptado')
      RETURNING *
    `;
    const valores = [
      mascota_id,
      titulo,
      descripcion || null,
      requisitos || null,
      imagen_publicacion || null
    ];

    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la publicación de adopción' });
  }
});


router.delete('/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  try {
    const pub = await pool.query('SELECT mascota_id FROM publicaciones_adopciones WHERE id = $1', [id]);
    if (pub.rowCount === 0) return res.status(404).json({ error: 'Publicación no encontrada' });

    const mascota = await pool.query('SELECT duenio_id FROM mascotas WHERE id = $1', [pub.rows[0].mascota_id]);
    if (mascota.rowCount === 0) return res.status(404).json({ error: 'Mascota no encontrada' });

    if (mascota.rows[0].duenio_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado: solo el dueño puede eliminar la publicación' });
    }

    const resultado = await pool.query('DELETE FROM publicaciones_adopciones WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Publicación eliminada correctamente', publicacion: resultado.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la publicación' });
  }
});

module.exports = router;
