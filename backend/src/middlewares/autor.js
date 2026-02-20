const jwt = require('jsonwebtoken');

const autenticar = (req, res, next) => {
  const encabezadoAutorizacion = req.headers.authorization || req.headers.Authorization;
  if (!encabezadoAutorizacion) return res.status(401).json({ error: 'No se proporcionó un token' });

  const secciones = encabezadoAutorizacion.split(' ');
  const tipo = secciones[0];
  const token = secciones[1];

  if (secciones.length !== 2 || tipo !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET || 'contra-super-segura');
    req.user = datos;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = autenticar;