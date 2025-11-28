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
      ORDER BY a.fecha_solicitud DESC)
    `,);
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', autenticar, async (req, res) => {
  try {
    const { publicacion_adopciones_id } = req.body;
    const adoptante_id = req.user.id;
    if (!publicacion_adopciones_id) {
      return res.status(400).json({ error: 'publicacion_adopciones_id es obligatorio' });
    }
    const existe = await pool.query(
      `SELECT 1 FROM adopciones WHERE publicacion_adopciones_id = $1 AND estado IN ('pendiente','aceptada') LIMIT 1`,
      [publicacion_adopciones_id]
    );
    if (existe.rowCount > 0) {
      return res.status(400).json({ error: 'La mascota ya tiene una solicitud activa' });
    }
    const query = `
      INSERT INTO adopciones ( 
        estado, 
        mensaje_solicitud, 
        publicacion_adopciones_id, 
        adoptante_id
      )
      VALUES ('pendiente', $1, $2, $3)
      RETURNING *
    `;
    const { mensaje_solicitud } = req.body;
    const valores = [
      mensaje_solicitud || null, 
      publicacion_adopciones_id, 
      adoptante_id
    ];
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

module.exports = router;