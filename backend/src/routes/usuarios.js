const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuarios');
    res.json(resultado.rows);
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
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya está registrado. Por favor usá otro.' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
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

router.post('/login', async (req, res) => {
  const { email, contrasenia } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND contrasenia = $2';
    const valores = [email, contrasenia];
    
    const resultado = await pool.query(query, valores);

    if (resultado.rows.length > 0) {
      res.json(resultado.rows[0]);
    } else {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;