CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasenia VARCHAR(200) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    direccion VARCHAR(150) NOT NULL
);

CREATE TABLE mascotas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50) DEFAULT 'no_tiene',
    tamanio VARCHAR(40),
    duenio_id INT REFERENCES usuarios(id)
);

CREATE TABLE publicaciones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_publicacion DATE DEFAULT CURRENT_DATE,
    ubicacion VARCHAR(100) NOT NULL,
    mascota_id INT REFERENCES mascotas(id)
);

CREATE TABLE adopciones (
    id SERIAL PRIMARY KEY,
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    estado VARCHAR(20),
    mensaje_solicitud TEXT,
    notas_adicionales TEXT,
    publicacion_id INTEGER REFERENCES publicaciones(id),
    adoptante_id INTEGER REFERENCES usuarios(id)
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_likes INTEGER DEFAULT 0,
    publicacion_id INTEGER REFERENCES publicaciones(id),
    usuario_id INTEGER REFERENCES usuarios(id)
);