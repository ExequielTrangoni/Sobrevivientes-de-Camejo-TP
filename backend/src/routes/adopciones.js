const express = require('express');
const router = express.Router();
const pool = require('../db');
const autenticar = require('../middlewares/autor');
const estadosPermitidos = ['pendiente', 'aceptada', 'rechazada'];

router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT a.*, p.mascota_id, p.titulo AS publicacion_titulo, m.nombre AS mascota_nombre, a.adoptante_id
      FROM adopciones a
      JOIN publicaciones_adopciones p ON a.publicacion_adopciones_id = p.id
      JOIN mascotas m ON p.mascota_id = m.id
      ORDER BY a.fecha_solicitud DESC
    `);
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', autenticar, async (req, res) => {
  const { publicacion_adopciones_id, mensaje_solicitud } = req.body;
  const adoptante_id = req.user.id;
  if (!publicacion_adopciones_id) {
    return res.status(400).json({ error: 'Falta el ID de la publicación' });
  }
  try {
    const existe = await pool.query(
      `SELECT 1 FROM adopciones 
       WHERE publicacion_adopciones_id = $1 AND adoptante_id = $2`,
      [publicacion_adopciones_id, adoptante_id]
    );

    if (existe.rowCount > 0) {
      return res.status(400).json({ error: 'Ya enviaste una solicitud para esta mascota' });
    }
    const query = `
      INSERT INTO adopciones (
        publicacion_adopciones_id, 
        adoptante_id, 
        mensaje_solicitud, 
        estado
      )
      VALUES ($1, $2, $3, 'pendiente')
      RETURNING *
    `;
    const valores = [publicacion_adopciones_id, adoptante_id, mensaje_solicitud || null];
    
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la adopción' });
  }
});

router.patch('/:id/estado', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    let { estado } = req.body;
    if (!estado) return res.status(400).json({ error: 'Estado requerido' });
    estado = estado.toLowerCase();

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const adop = await pool.query('SELECT * FROM adopciones WHERE id = $1', [id]);
    if (adop.rowCount === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const adopRow = adop.rows[0];

    const pub = await pool.query('SELECT * FROM publicaciones WHERE id = $1', [adopRow.publicacion_adopciones_id]);
    if (pub.rowCount === 0) return res.status(404).json({ error: 'Publicación no encontrada' });
    const pubRow = pub.rows[0];

    const mascota = await pool.query('SELECT duenio_id FROM mascotas WHERE id = $1', [pubRow.mascota_id]);
    if (mascota.rowCount === 0) return res.status(404).json({ error: 'Mascota no encontrada' });

    const duenio_id = mascota.rows[0].duenio_id;
    if (duenio_id !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado: solo el dueño puede cambiar el estado' });
    }

    if (estado === 'aceptada') {
      const otraAceptada = await pool.query(
        `SELECT 1 FROM adopciones WHERE publicacion_id = $1 AND estado = 'aceptada' AND id <> $2 LIMIT 1`,
        [adopRow.publicacion_id, id]
      );
      if (otraAceptada.rowCount > 0) {
        return res.status(400).json({ error: 'Ya existe una solicitud aceptada para esta publicación' });
      }
    }

    const actualizar = await pool.query('UPDATE adopciones SET estado = $1 WHERE id = $2 RETURNING *', [estado, id]);

    res.json(actualizar.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const adop = await pool.query('SELECT * FROM adopciones WHERE id = $1', [id]);
    if (adop.rowCount === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const adopRow = adop.rows[0];

    const pub = await pool.query('SELECT * FROM publicaciones WHERE id = $1', [adopRow.publicacion_adopciones_id]);
    const pubRow = pub.rows[0];
    const mascota = await pool.query('SELECT duenio_id FROM mascotas WHERE id = $1', [pubRow.mascota_id]);
    const duenio_id = mascota.rows[0].duenio_id;

    if (req.user.id !== adopRow.adoptante_id && req.user.id !== duenio_id) {
      return res.status(403).json({ error: 'No autorizado para borrar esta solicitud' });
    }

    const resultado = await pool.query('DELETE FROM adopciones WHERE id = $1 RETURNING *', [id]);
    res.json({ message: 'Solicitud eliminada', solicitud: resultado.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error eliminando solicitud' });
  }
});

router.get('/usuario/:id', autenticar, async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT a.*, p.titulo AS publicacion_titulo, m.nombre AS nombre_mascota, m.imagen_mascota
      FROM adopciones a
      JOIN publicaciones_adopciones p ON a.publicacion_adopciones_id = p.id
      JOIN mascotas m ON p.mascota_id = m.id
      WHERE a.adoptante_id = $1
      ORDER BY a.fecha_solicitud DESC
    `;
    const resultado = await pool.query(query, [id]);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tus solicitudes' });
  }
});

module.exports = router;