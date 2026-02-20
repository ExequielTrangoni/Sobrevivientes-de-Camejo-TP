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
  const { id } = req.params;
  let { estado } = req.body;
  
  console.log(`Intentando actualizar solicitud ID: ${id} a estado: ${estado}`);

  try {
    if (!estado || !['aceptada', 'rechazada'].includes(estado.toLowerCase())) {
      return res.status(400).json({ error: 'Estado inválido. Debe ser "aceptada" o "rechazada"' });
    }
    estado = estado.toLowerCase();

    const queryInfo = `
        SELECT 
            a.id AS solicitud_id,
            a.estado AS estado_actual,
            a.publicacion_adopciones_id,
            a.adoptante_id,
            m.duenio_id,
            m.id AS mascota_id,
            p.id AS pub_id
        FROM adopciones a
        LEFT JOIN publicaciones_adopciones p ON a.publicacion_adopciones_id = p.id
        LEFT JOIN mascotas m ON p.mascota_id = m.id
        WHERE a.id = $1
    `;
    const info = await pool.query(queryInfo, [id]);
    
    if (info.rowCount === 0) {
        console.error("Solicitud no encontrada en BD");
        return res.status(404).json({ error: 'La solicitud de adopción no existe' });
    }

    const datos = info.rows[0];

    if (!datos.pub_id) {
        return res.status(404).json({ error: 'La publicación asociada a esta solicitud ya no existe' });
    }

    if (datos.duenio_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso: No eres el dueño de esta mascota' });
    }
    const actualizar = await pool.query(
        'UPDATE adopciones SET estado = $1 WHERE id = $2 RETURNING *', 
        [estado, id]
    );

    if (estado === 'aceptada') {
        console.log(`Solicitud aceptada. Transfiriendo mascota ${datos.mascota_id} al usuario ${datos.adoptante_id}`);
        await pool.query(
            "UPDATE mascotas SET duenio_id = $1 WHERE id = $2",
            [datos.adoptante_id, datos.mascota_id]
        );
        await pool.query(
            "UPDATE publicaciones_adopciones SET estado_mascota = 'adoptado' WHERE id = $1",
            [datos.pub_id]
        );
        await pool.query(
            "UPDATE adopciones SET estado = 'rechazada' WHERE publicacion_adopciones_id = $1 AND id <> $2 AND estado = 'pendiente'",
            [datos.pub_id, id]
        );
    }

    res.json(actualizar.rows[0]);

  } catch (error) {
    console.error("Error en PATCH adopciones:", error);
    res.status(500).json({ error: 'Error interno al actualizar estado' });
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

router.get('/recibidas', autenticar, async (req, res) => {
  try {
    const duenio_id = req.user.id;
    const query = `
      SELECT 
        a.id AS solicitud_id,
        a.fecha_solicitud,
        a.mensaje_solicitud,
        a.estado,
        m.nombre AS nombre_mascota,
        m.imagen_mascota,
        u.nombre AS nombre_adoptante,
        u.email AS email_adoptante,
        u.telefono AS telefono_adoptante,
        u.imagen_usuario AS imagen_adoptante
      FROM adopciones a
      JOIN publicaciones_adopciones pa ON a.publicacion_adopciones_id = pa.id
      JOIN mascotas m ON pa.mascota_id = m.id
      JOIN usuarios u ON a.adoptante_id = u.id
      WHERE m.duenio_id = $1
      ORDER BY a.fecha_solicitud DESC
    `;
    
    const resultado = await pool.query(query, [duenio_id]);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener solicitudes recibidas' });
  }
});

module.exports = router;