CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasenia VARCHAR(200) NOT NULL,
    imagen_usuario varchar(250),
    telefono VARCHAR(50) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    nacimiento DATE,
    ciudad VARCHAR(100),
    biografia TEXT,
    fecha_creacion DATE DEFAULT CURRENT_DATE
);

CREATE TYPE especie_mascotas AS ENUM ('perro', 'gato', 'otro');

CREATE TABLE mascotas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie especie_mascotas NOT NULL DEFAULT 'otro',
    edad INT NOT NULL,
    raza VARCHAR(50) DEFAULT 'no-tiene',
    tamanio VARCHAR(40),
    imagen_mascota varchar(250),
    duenio_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE publicaciones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen_publicacion varchar(250) NOT NULL,
    fecha_publicacion DATE DEFAULT CURRENT_DATE,
    ubicacion VARCHAR(100) NOT NULL,
    mascota_id INT NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE
);

CREATE TABLE amigos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    amigo_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TYPE estado_mascota_enum AS ENUM ('no-adoptado', 'pendiente', 'adoptado');

CREATE TABLE publicaciones_adopciones (
    id SERIAL PRIMARY KEY,
    mascota_id INT NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requisitos TEXT,
    imagen_publicacion VARCHAR(250),
    estado_mascota estado_mascota_enum DEFAULT 'no-adoptado',
    fecha_publicacion DATE DEFAULT CURRENT_DATE
);

CREATE TYPE estado_adopcion AS ENUM ('pendiente', 'aceptada', 'rechazada');

CREATE TABLE adopciones (
    id SERIAL PRIMARY KEY,
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado estado_adopcion NOT NULL DEFAULT 'pendiente',
    mensaje_solicitud TEXT,
    publicacion_adopciones_id INTEGER NOT NULL REFERENCES publicaciones_adopciones(id) ON DELETE CASCADE,
    adoptante_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL  
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cantidad_likes INTEGER DEFAULT 0,
    publicacion_id INTEGER REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);
