const API_USUARIO = "http://localhost:3000/api/usuarios";
const API_MASCOTAS = "http://localhost:3000/api/mascotas";
const API_PUBLICACIONES = "http://localhost:3000/api/publicaciones";


let usuarioId = localStorage.getItem('usuarioId');
let usuario = {};
let amigos = [];
let mascotas = [];
let publicaciones = [];


const modalLogin = document.getElementById("modalLogin");
const botonIrLogin = document.getElementById("botonIrLogin");

const listaAmigos = document.getElementById("listaAmigos");
const galeriaMascotas = document.getElementById("galeriaMascotas");
const totalAmigos = document.getElementById("totalAmigos");
const totalMascotas = document.getElementById("totalMascotas");
const totalPublicaciones = document.getElementById("totalPublicaciones");
const galeriaPublicaciones = document.getElementById("misPublicaciones");

const modalEditar = document.getElementById("modalEditar");
const botonEditar = document.getElementById("botonEditarPerfil");
const botonCerrarEditar = document.getElementById("cerrarModal");
const formPerfil = document.getElementById("formPerfil");
const formMascota = document.getElementById("formMascota");


document.addEventListener("DOMContentLoaded", () => {
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        modalLogin.style.display = "flex";

        botonIrLogin.addEventListener("click", () => {
            window.location.href = './login.html';
        });

        window.addEventListener("click", (e) => {
            if (e.target === modalLogin) window.location.href = './login.html';
        });
    }else {
        initPerfil();
    }
});


function actualizarTotales() {
    totalAmigos.textContent = amigos.length;
    totalMascotas.textContent = mascotas.length;
    totalPublicaciones.textContent = publicaciones.length;
}

async function cargarPerfil() {
    try {
        const res = await fetch(`${API_USUARIO}/${usuarioId}`);
        usuario = await res.json();
        renderPerfil();
    } catch (err) {
        console.error('Error al cargar perfil:', err);
    }
}

function renderPerfil() {
    document.getElementById("fotoPerfil").src = usuario.imagen_usuario || "../images/gato-1.jpg";
    document.getElementById("nombre").textContent = `Nombre: ${usuario.nombre}`;
    document.getElementById("nickname").textContent = `Nickname: ${usuario.nickname || ''}`;
    document.getElementById("contrasenia").textContent = `Contraseña: ${"*".repeat(usuario.contrasenia?.length || 0)}`;
    document.getElementById("email").textContent = `Email: ${usuario.email}`;
    document.getElementById("nacimiento").textContent = `Nacimiento: ${usuario.nacimiento || ''}`;
    document.getElementById("ciudad").textContent = `Ciudad: ${usuario.ciudad || ''}`;
    document.getElementById("biografia").textContent = `Biografía: ${usuario.biografia || ''}`;
}

async function cargarAmigos() {
    try {
        const res = await fetch(`${API_USUARIO}/${usuarioId}/amigos`);
        amigos = await res.json();
        renderAmigos();
    } catch (err) {
        console.error('Error al cargar amigos:', err);
    }
}

function renderAmigos() {
    listaAmigos.innerHTML = '';

    if (!amigos.length)
        return listaAmigos.innerHTML = '<p>No tienes amigos</p>';

    amigos.forEach(a => {
        const li = document.createElement('li');
        li.className = 'amigoItem';

        const img = document.createElement('img');
        img.className = 'fotoAmigo';
        img.src = a.imagen_usuario ? `${API_USUARIO}/${a.imagen_usuario}` : '../images/gato-1.jpg';
        img.alt = a.nombre;
        img.width = 40;
        img.height = 40;

        const span = document.createElement('span');
        span.textContent = a.nombre;

        const btn = document.createElement('button');
        btn.textContent = '🗑 Eliminar';
        btn.addEventListener('click', async () => {
            await fetch(`${API_USUARIO}/${usuarioId}/amigos/${a.id}`, {
                method: 'DELETE'
            });
            await cargarAmigos();
            actualizarTotales();
        });

        li.appendChild(img);
        li.appendChild(span);
        li.appendChild(btn);

        listaAmigos.appendChild(li);
    });
}


async function cargarMascotas() {
    try {
        const res = await fetch(`${API_MASCOTAS}?duenio_id=${usuarioId}`);
        mascotas = await res.json();
        renderMascotas();
    } catch (err) {
        console.error('Error al cargar mascotas:', err);
    }
}

function renderMascotas() {
    galeriaMascotas.innerHTML = '';
    if (!mascotas.length) return galeriaMascotas.innerHTML = '<p>No tienes mascotas</p>';

    mascotas.forEach(m => {
        const div = document.createElement('div');
        div.className = 'mascota';
        div.innerHTML = `
            <img src="${m.imagen_mascota || '../images/perro-1.jpg'}" alt="${m.nombre}">
            <p>${m.nombre}</p>
            <button class="eliminarMascota">🗑 Eliminar</button>
        `;
        div.querySelector('.eliminarMascota').addEventListener('click', async () => {
            await fetch(`${API_MASCOTAS}/${m.id}`, { method: 'DELETE' });
            await cargarMascotas();
            actualizarTotales();
        });
        galeriaMascotas.appendChild(div);
    });
}

async function cargarPublicaciones() {
    try {
        const res = await fetch(`${API_PUBLICACIONES}?usuario_id=${usuarioId}`);
        publicaciones = await res.json();
        renderPublicaciones();
    } catch (err) {
        console.error('Error al cargar publicaciones.', err);
    }
}

function renderPublicaciones() {
    galeriaPublicaciones.innerHTML = '';
    if (!publicaciones.length) return galeriaPublicaciones.innerHTML = '<p>No tienes publicaciones</p>';

    publicaciones.forEach(p => {
        const div = document.createElement('div');
        div.className = 'publicacion';
        div.innerHTML = `
            <button class="eliminarBoton">🗑</button>
            <img src="${p.imagen_publicacion || '../images/publicacion-ejemplo.webp'}" alt="Publicación">
            <p>${p.descripcion || p.titulo}</p>
        `;
        div.querySelector('.eliminarBoton').addEventListener('click', async () => {
            await fetch(`${API_PUBLICACIONES}/${p.id}`, { method: 'DELETE' });
            await cargarPublicaciones();
            actualizarTotales();
        });
        galeriaPublicaciones.appendChild(div);
    });
}

botonEditar.addEventListener('click', () => {
    document.getElementById("inputNombre").value = usuario.nombre || '';
    document.getElementById("inputNickname").value = usuario.nickname || '';
    document.getElementById("inputContrasenia").value = usuario.contrasenia || '';
    document.getElementById("inputEmail").value = usuario.email || '';
    document.getElementById("inputNacimiento").value = usuario.nacimiento || '';
    document.getElementById("inputCiudad").value = usuario.ciudad || '';
    document.getElementById("inputBiografia").value = usuario.biografia || '';
    modalEditar.style.display = 'flex';
});

botonCerrarEditar.addEventListener('click', () => modalEditar.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modalEditar) modalEditar.style.display = 'none'; });

formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
        nombre: document.getElementById("inputNombre").value,
        nickname: document.getElementById("inputNickname").value,
        contrasenia: document.getElementById("inputContrasenia").value,
        email: document.getElementById("inputEmail").value,
        nacimiento: document.getElementById("inputNacimiento").value,
        ciudad: document.getElementById("inputCiudad").value,
        biografia: document.getElementById("inputBiografia").value
    };
    try {
        await fetch(`${API_USUARIO}/${usuarioId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
        await cargarPerfil();
        modalEditar.style.display = 'none';
    } catch (err) {
        console.error('Error al actualizar perfil.', err);
    }
});


async function initPerfil() {
    try {
        await cargarPerfil();
        await cargarAmigos();
        await cargarMascotas();
        await cargarPublicaciones();
        actualizarTotales();
    } catch (err) {
        console.error("Error inicializando la página:", err);
        alert("Ocurrió un error al cargar los datos del perfil.");
    }
}
