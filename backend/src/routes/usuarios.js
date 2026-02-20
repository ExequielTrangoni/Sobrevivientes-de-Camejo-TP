const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const path = require('path');
const autenticar = require('../middlewares/autor');
const autenticar = require('../middlewares/autor');
const upload = require('../middlewares/upload');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', autenticar, async (req, res) => {
    try {
        const query = 'SELECT * FROM usuarios WHERE id = $1';
        const resultado = await pool.query(query, [req.user.id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/registro', async (req, res) => {
  const { nombre, email, contrasenia, telefono, direccion } = req.body;

  const query = `
    INSERT INTO usuarios (nombre, email, contrasenia, telefono, direccion)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const valores = [nombre, email, contrasenia, telefono, direccion];

  try {
    const resultado = await pool.query(query, valores);
    const usuario = resultado.rows[0];
    const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre },
        process.env.JWT_SECRET || 'contra-super-segura',
        { expiresIn: '5h' }
    );
    res.json({ token, usuario });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
    const { email, contrasenia } = req.body;

    try {
        const query = 'SELECT * FROM usuarios WHERE email = $1 AND contrasenia = $2';
        const valores = [email.trim(), contrasenia.trim()];

        const resultado = await pool.query(query, valores);

        if (resultado.rows.length > 0) {
            const usuario = resultado.rows[0];
            const token = jwt.sign(
                { id: usuario.id, nombre: usuario.nombre },
                process.env.JWT_SECRET || 'contra-super-segura',
                { expiresIn: '5h' }
            );
            res.json({ token, usuario });
        } else {
            res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/enviar', async (req, res) => {
    const {usuarioId,amigoId} = req.body;

    if(usuarioId === amigoId) {
        return res.status(400).json({ error: 'No puedes agregarte a ti mismo' });
    }

    try{
        const existe = await pool.query(
            'SELECT * FROM amigos WHERE usuario_id = $1 AND amigo_id = $2',
            [usuarioId,amigoId]
        );
        if(existe.rows.length > 0){
            return res.status(409).json({ error: 'Solicitud ya enviada' });
        }
        await pool.query(
            'INSERT INTO amigos (usuario_id, amigo_id,estado) VALUES ($1,$2,$3)',
            [usuarioId,amigoId,'pendiente']
        );
        res.json({mensaje:"Solicitud enviada"});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
})

router.post('/aceptar', async (req, res) => {
    const{usuarioId,amigoId} = req.body;

    try {
        const resultado = await pool.query(
            "UPDATE amigos SET estado = $1 WHERE usuario_id = $2 AND amigo_id = $3 RETURNING *",
            ['aceptado', amigoId, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({error: 'Solicitud no encontrada'});
        }
        res.json({mensaje:"Solicitud aceptada"});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
})

router.get('/:id/amigos', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.email, u.imagen_usuario
             FROM amigos a
             JOIN usuarios u ON (u.id = a.amigo_id AND a.usuario_id =$1)
             OR (u.id = a.usuario_id AND a.amigo_id =$1)
             WHERE a.estado = 'aceptado'`,
            [id]
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id/amigos-pendientes', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.email, u.imagen_usuario
             FROM amigos a JOIN usuarios u ON u.id = a.usuario_id
             WHERE a.amigo_id = $1 AND a.estado = 'pendiente'`,
            [id]
        );
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id/amigos/:amigoId', async (req, res) => {
    const usuarioId = req.params.id;
    const amigoId = req.params.amigoId;
    try {
        await pool.query(
            `DELETE FROM amigos
             WHERE (usuario_id = $1 AND amigo_id = $2)
                OR (usuario_id = $2 AND amigo_id = $1)`,
            [usuarioId, amigoId]
        );
        res.json({ mensaje: 'Amigo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', upload.single('imagen_usuario'), async (req, res) => {
    const { id } = req.params;

    let { nombre, nickname, email, contrasenia, telefono, direccion, nacimiento, ciudad, biografia } = req.body;

    if (nacimiento === "") nacimiento = null;

    let imagen_usuario = req.file ? req.file.filename : req.body.imagen_usuario;

    try {
        const resultado = await pool.query(
            `UPDATE usuarios
             SET nombre=$1, nickname=$2, email=$3, contrasenia=$4, imagen_usuario=$5,
                 telefono=$6, direccion=$7, nacimiento=$8, ciudad=$9, biografia=$10
             WHERE id=$11 RETURNING *`,
            [nombre, nickname, email, contrasenia, imagen_usuario, telefono, direccion, nacimiento, ciudad, biografia, id]
        );

        if (resultado.rows.length === 0)
            return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json(resultado.rows[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {

        return res.status(400).json({ error: 'ID inválido, debe ser un número' });
    }
    try {
        const query = 'SELECT * FROM usuarios WHERE id = $1';
        const resultado = await pool.query(query, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'ID inválido, debe ser un número' });
    }
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;