const API_USUARIO = "http://localhost:3000/api/usuarios";
const API_MASCOTAS = "http://localhost:3000/api/mascotas";
const API_PUBLICACIONES = "http://localhost:3000/api/publicaciones";


let usuario = {};
let amigos = {};
let mascotas = {};
let publicaciones = {};
let solicitudes = {};

const listaAmigos = document.getElementById("listaAmigos");
const galeriaMascotas = document.getElementById("galeriaMascotas");
const totalAmigos = document.getElementById("totalAmigos");
const totalMascotas = document.getElementById("totalMascotas");
const totalPublicaciones = document.getElementById("totalPublicaciones");
const totalSolicitudes = document.getElementById("totalSolicitudes");
const galeriaPublicaciones = document.getElementById("misPublicaciones");

const modalEditar = document.getElementById("modalEditar");
const botonEditar = document.getElementById("botonEditarPerfil");
const botonCerrarEditar = document.getElementById("cerrarModal");
const formPerfil = document.getElementById("formPerfil");
const formMascota = document.getElementById("formMascota");
const botonAbrirFormMascota = document.getElementById("botonAbrirFormMascota");
const formMascotaContainer = document.getElementById("formMascotaContainer");
const cerrarFormMascota = document.getElementById("cerrarFormMascota");

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("usuarioId");
const mostrarId = perfilId || getUsuarioId();

document.addEventListener("DOMContentLoaded",async () => {
    const modalLogin = document.getElementById("modalLogin");
    const botonIrLogin = document.getElementById("botonIrLogin");
    if (!getUsuarioId()) {
        modalLogin.style.display = "flex";

        botonIrLogin.addEventListener("click", () => {
            window.location.href = './login.html';
        });

        window.addEventListener("click", (e) => {
            if (e.target === modalLogin) window.location.href = './login.html';
        });
    }else {
        await initPerfil();
    }
});

botonAbrirFormMascota.addEventListener('click', () => {
    formMascotaContainer.style.display = 'flex';
});

cerrarFormMascota.addEventListener('click', () => {
    formMascotaContainer.style.display = 'none';
});

function getUsuarioId() {
    return localStorage.getItem('usuarioId');
}

function actualizarTotales() {
    totalAmigos.textContent = amigos.length;
    totalMascotas.textContent = mascotas.length;
    totalPublicaciones.textContent = publicaciones.length;
    totalSolicitudes.textContent = solicitudes.length;
}

async function obtenerEstadoAmistad() {
    const miId = getUsuarioId();
    const otroId = mostrarId;

    if (!miId || !otroId || miId == otroId) return "propio";

    const token = localStorage.getItem('token');

    const amigos = await fetch(`${API_USUARIO}/${miId}/amigos`, {
        headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json());

    if (amigos.some(a => a.id == otroId)) return "amigos";

    const solicitudesRecibidas = await fetch(`${API_USUARIO}/${miId}/amigos-pendientes`, {
        headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json());

    if (solicitudesRecibidas.some(s => s.id == otroId ))
        return "pendiente-recibida";

    const solicitudesRecibidasPorElOtro = await fetch(`${API_USUARIO}/${otroId}/amigos-pendientes`, {
        headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json());

    if (solicitudesRecibidasPorElOtro.some(s => s.id == miId ))
        return "pendiente-enviada";

    return "ninguna";
}

async function cargarPerfil() {
    try {
        const res = await fetch(`${API_USUARIO}/${mostrarId}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        usuario = await res.json();
        const contenedor = document.getElementById("zonaSolicitudesPerfil");
        const esPerfilPropio = mostrarId == getUsuarioId();
        renderPerfil();

        if (!esPerfilPropio){
            document.getElementById("botonEditarPerfil").style.display = "none";

            const inputs = document.querySelectorAll('#formPerfil input');
            inputs.forEach(input => input.disabled = true);

            const boton = document.getElementById("botonAgregarAmigo");
            const estado = await obtenerEstadoAmistad();

            if (estado === "amigos") {
                boton.style.display = "none";
            }
            else if (estado === "pendiente-enviada") {
                boton.style.display = "block";
                boton.textContent = "Solicitud enviada";
                boton.disabled = true;
            }
            else if (estado === "pendiente-recibida") {
                boton.style.display = "none";
                contenedor.innerHTML = `
                    <button class="boton boton-secundario" id="botonAceptarPerfil">Aceptar solicitud</button>
                    <button class="boton boton-eliminar" id="botonRechazarPerfil">Rechazar solicitud</button>
                `;
                const botonAceptar = document.getElementById("botonAceptarPerfil");
                const botonRechazar = document.getElementById("botonRechazarPerfil");

                botonAceptar.onclick = async () => {
                    await aceptarSolicitud(mostrarId);
                    botonAceptar.style.display = "none";
                    botonRechazar.style.display = "none";
                };

                botonRechazar.onclick = async () => {
                    await rechazarSolicitud(mostrarId);
                    botonAceptar.style.display = "none";
                    botonRechazar.style.display = "none";
                    boton.style.display = "block";
                    boton.textContent = "Agregar amigo";
                    boton.disabled = false;
                };
            }
            else if (estado === "ninguna") {
                boton.style.display = "block";
                boton.textContent = "Agregar amigo";
                boton.disabled = false;

                boton.onclick = async () => {
                    boton.disabled = true;
                    boton.textContent = "Enviando...";

                    const res = await fetch(`${API_USUARIO}/enviar`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + localStorage.getItem('token')
                        },
                        body: JSON.stringify({
                            usuarioId: getUsuarioId(),
                            amigoId: mostrarId
                        })
                    });

                    if (res.ok) {
                        boton.textContent = "Solicitud enviada";
                    } else {
                        boton.textContent = "Agregar amigo";
                        boton.disabled = false;
                    }
                };
            }
        } else {
            document.getElementById("botonAgregarAmigo").style.display = "none";

            const inputs = document.querySelectorAll('#formPerfil input');
            inputs.forEach(input => input.disabled = false);

            document.getElementById("botonEditarPerfil").style.display = "block";
        }

    } catch (err) {
        console.error('Error al cargar perfil:', err);
    }
}

function renderPerfil() {
    const esPerfilPropio = mostrarId == getUsuarioId();

    document.getElementById("fotoPerfil").src = usuario.imagen_usuario || "../images/gato-1.jpg";
    document.getElementById("nombre").textContent = `Nombre: ${usuario.nombre}`;
    document.getElementById("nickname").textContent = `Nickname: ${usuario.nickname || ''}`;
    const contrasenia = document.getElementById("contrasenia");
    if(esPerfilPropio){
        contrasenia.style.display = "block";
        contrasenia.textContent = `Contraseña: ${"*".repeat(usuario.contrasenia?.length || 0)}`;
    }else{
        contrasenia.style.display = "none";
    }
    document.getElementById("email").textContent = `Email: ${usuario.email}`;
    document.getElementById("telefono").textContent = `Telefono: ${usuario.telefono}`;
    document.getElementById("direccion").textContent = `Direccion: ${usuario.direccion}`;
    document.getElementById("nacimiento").textContent = `Nacimiento: ${usuario.nacimiento || ''}`;
    document.getElementById("ciudad").textContent = `Ciudad: ${usuario.ciudad || ''}`;
    document.getElementById("biografia").textContent = `Biografía: ${usuario.biografia || ''}`;
}

async function cargarAmigos() {
    try {
        const res = await fetch(`${API_USUARIO}/${mostrarId}/amigos`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        amigos = await res.json();

        renderAmigos();
    } catch (err) {
        console.error('Error al cargar amigos:', err);
    }
}

function renderAmigos() {
    listaAmigos.innerHTML = '';

    if (!amigos.length) {
        return listaAmigos.innerHTML = '<p>No tienes amigos</p>';
    }

    const esPerfilPropio = mostrarId == getUsuarioId();

    amigos.forEach(amigo => {
        const div = document.createElement('div');
        div.className = 'tarjeta amigoItem';

        div.innerHTML = `
            <img class="imgRedonda" src="${amigo.imagen_usuario || '../images/gato-1.jpg'}" alt="${amigo.nombre}">
                <h4 class="textoCompacto">
                    ${linkPerfil(amigo.id, amigo.nombre)}
                </h4>
            ${esPerfilPropio ? '<button class="boton boton-eliminar">🗑</button>' : ''}
        `;

        if (esPerfilPropio) {
            div.querySelector('.boton-eliminar').addEventListener('click', async () => {
                if (!confirm("¿Seguro que deseas eliminar a este amigo?")) return;
                await fetch(`${API_USUARIO}/${getUsuarioId()}/amigos/${amigo.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: "Bearer " + localStorage.getItem('token') }
                });
                await cargarAmigos();
                actualizarTotales();
            });
        }
        listaAmigos.appendChild(div);
    });
    actualizarTotales();
}

async function cargarMascotas() {
    try {
        const res = await fetch(`${API_MASCOTAS}?duenio_id=${mostrarId}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        mascotas = await res.json();

        const esPerfilPropio = mostrarId == getUsuarioId();

        if(botonAbrirFormMascota) botonAbrirFormMascota.style.display = esPerfilPropio ? 'block' : 'none';
        if(formMascota) formMascota.style.display = esPerfilPropio ? 'block' : 'none';
        document.getElementById("totalMascotas").textContent = mascotas.length;
        renderMascotas();
    } catch (err) {
        console.error('Error al cargar mascotas:', err);
    }
}

function renderMascotas() {
    galeriaMascotas.innerHTML = '';
    const esPerfilPropio = mostrarId == getUsuarioId();

    if (mascotas.length === 0) {
        galeriaMascotas.innerHTML = '<p>No tienes mascotas</p>';
        return;
    }

    mascotas.forEach(m => {
        const div = document.createElement('div');
        div.className = 'tarjeta mascotaItem';
        div.innerHTML = `
            <img class="imgRedonda" src="${m.imagen_mascota || '../images/perro-1.jpg'}" alt="${m.nombre}">
            <p class="textoCompacto">${m.nombre}</p>
            ${esPerfilPropio ? '<button class="boton boton-eliminar">🗑</button>' : ''}
        `;

        if (esPerfilPropio) {
            div.querySelector('.boton-eliminar').addEventListener('click', async () => {
                if (!confirm("¿Seguro que deseas eliminar esta mascota?")) return;
                await fetch(`${API_MASCOTAS}/${m.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: "Bearer " + localStorage.getItem('token') }
                });
                await cargarMascotas();
                actualizarTotales();
            });
        }
        galeriaMascotas.appendChild(div);
    });
}

async function cargarPublicaciones() {
    try {
        const res = await fetch(`${API_PUBLICACIONES}?usuario_id=${mostrarId}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
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
            <button class="boton boton-eliminar">🗑</button>
            <img src="${p.imagen_publicacion || '../images/publicacion-ejemplo.webp'}" alt="Publicación">
            <p>${p.descripcion || p.titulo}</p>
        `;
        div.querySelector('.boton-eliminar').addEventListener('click', async () => {
            await fetch(`${API_PUBLICACIONES}/${p.id}`, {
                method: 'DELETE',
                headers: { Authorization: "Bearer " + localStorage.getItem('token')}
            });
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
    document.getElementById('inputTelefono').value = usuario.telefono || '';
    document.getElementById('inputDireccion').value = usuario.direccion || '';
    document.getElementById("inputEmail").value = usuario.email || '';
    document.getElementById("inputNacimiento").value = usuario.nacimiento || null;
    document.getElementById("inputCiudad").value = usuario.ciudad || '';
    document.getElementById("inputBiografia").value = usuario.biografia || '';
    modalEditar.style.display = 'flex';
});

botonCerrarEditar.addEventListener('click', () => modalEditar.style.display = 'none');
window.addEventListener('click', e => { if (e.target === modalEditar) modalEditar.style.display = 'none'; });

formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fechaInput = document.getElementById("inputNacimiento").value;
    const datos = {
        nombre: document.getElementById("inputNombre").value,
        nickname: document.getElementById("inputNickname").value,
        email: document.getElementById("inputEmail").value,
        contrasenia: document.getElementById("inputContrasenia").value,
        imagen_usuario: document.getElementById("inputImagenUsuario").value,
        telefono: document.getElementById("inputTelefono").value,
        direccion: document.getElementById("inputDireccion").value,
        nacimiento: fechaInput === "" ? null : fechaInput,
        ciudad: document.getElementById("inputCiudad").value,
        biografia: document.getElementById("inputBiografia").value
    };
    try {
        await fetch(`${API_USUARIO}/${getUsuarioId()}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem('token')
            },
            body: JSON.stringify(datos)
        });
        await cargarPerfil();
        modalEditar.style.display = 'none';
    } catch (err) {
        console.error('Error al actualizar perfil.', err);
    }
});

function linkPerfil(id, nombre) {
    return `<a href="usuario.html?usuarioId=${id}" class="enlace-perfil">${nombre}</a>`;
}

async function cargarSolicitudes() {
    try {
        const token = localStorage.getItem('token');
        const usuario = JSON.parse(localStorage.getItem('usuario'));

        const esPerfilPropio = mostrarId == getUsuarioId();
        const contenedorSolicitudes = document.getElementById("solicitudes-container");

        contenedorSolicitudes.style.display = esPerfilPropio ? "block" : "none";

        if (!esPerfilPropio || !token || !usuario) return [];

        const userId = getUsuarioId();
        const res = await fetch(`${API_USUARIO}/${userId}/amigos-pendientes`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        solicitudes = await res.json();
        await renderSolicitudes();
    } catch (err) {
        console.error('Error al obtener solicitudes:', err);
        return [];
    }
}

function renderSolicitudes() {
    const lista = document.getElementById('listaSolicitudes');
    lista.innerHTML = '';

    if (!solicitudes.length) {
        lista.innerHTML = '<p>No hay solicitudes pendientes</p>';
    } else {
        solicitudes.forEach(solicitud => {
            const li = document.createElement('li');
            li.className = 'tarjeta solicitudItem';
            li.innerHTML = `
                <img class="imgRedonda" src="${solicitud.imagen_usuario || '../images/gato-1.jpg'}" alt="${solicitud.nombre}">
                <h4 class="textoCompacto">
                    ${linkPerfil(solicitud.id, solicitud.nombre)}
                </h4>

                <div>
                    <button class="boton boton-secundario aceptarBoton">Aceptar</button>
                    <button class="boton boton-eliminar rechazarBoton">Rechazar</button>
                </div>
            `;

            li.querySelector('.aceptarBoton').addEventListener('click', async () => {
                if (!confirm(`¿Seguro que deseas aceptar a ${solicitud.nombre}?`)) return;
                await aceptarSolicitud(solicitud.id);
                await cargarSolicitudes();
                await cargarAmigos();
            });

            li.querySelector('.rechazarBoton').addEventListener('click', async () => {
                if (!confirm(`¿Seguro que deseas rechazar a ${solicitud.nombre}?`)) return;
                await rechazarSolicitud(solicitud.id);
                await cargarSolicitudes();
                await cargarAmigos();
            });

            lista.appendChild(li);
        });
    }
    totalSolicitudes.textContent = solicitudes.length;
}

async function aceptarSolicitud(remitenteId) {
    try {
        const token = localStorage.getItem('token');
        const userId = getUsuarioId();

        const res = await fetch(`${API_USUARIO}/aceptar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ usuarioId: userId, amigoId: remitenteId })
        });

        if (!res.ok) {
            const error = await res.text();
            console.error('Error al aceptar solicitud:', error);
            alert('Error al aceptar solicitud');
            return;
        }

        await cargarSolicitudes();
        await cargarAmigos();
    } catch (err) {
        console.error('Error aceptar solicitud:', err);
    }
}

async function rechazarSolicitud(remitenteId) {
    try {
        const token = localStorage.getItem('token');
        const userId = getUsuarioId();

        const res = await fetch(`${API_USUARIO}/${userId}/amigos/${remitenteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.text();
            console.error('Error al rechazar solicitud:', error);
            alert('Error al rechazar solicitud');
            return;
        }
        await cargarSolicitudes();
    } catch (err) {
        console.error('Error rechazar solicitud:', err);
    }
}

formMascota.addEventListener('submit', async (e) => {
    const token = localStorage.getItem('token');
    e.preventDefault();

    const datos = {
        nombre: document.getElementById("mascotaNombre").value,
        especie: document.getElementById("mascotaEspecie").value,
        edad: parseInt(document.getElementById("mascotaEdad").value),
        raza: document.getElementById("mascotaRaza").value || "no-tiene",
        tamanio: document.getElementById("mascotaTamanio").value,
        imagen_mascota: document.getElementById("mascotaImagen").value || null,
    };

    try {
        if(!token) {
            console.error("No hay token")
            return;
        }
        const res = await fetch(API_MASCOTAS, {
            method: "POST",
            headers: {"Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem('token')},
                body: JSON.stringify(datos)
        });

        if (!res.ok) {
            const error = await res.text();
            console.error("Error backend:", error);
            return;
        }

        await cargarMascotas();
        actualizarTotales();
        formMascota.reset();
        formMascotaContainer.style.display = 'none';

    } catch (err) {
        console.error("Error al agregar mascota:", err);
    }
});
//PRUEBA
//const botonLogout = document.createElement('button');
//botonLogout.textContent = 'Cerrar sesión';
//botonLogout.addEventListener('click', () => {
//    localStorage.removeItem('token');
//    localStorage.removeItem('usuario');
//    localStorage.removeItem('usuarioId');
//    window.location.href = './login.html';
//});

//document.body.prepend(botonLogout);

async function initPerfil() {
    try {
        await cargarPerfil();
        await cargarAmigos();
        await cargarMascotas();
        await cargarPublicaciones();
        await cargarSolicitudes();
        actualizarTotales();
    } catch (err) {
        console.error("Error inicializando la página:", err);
        alert("Ocurrió un error al cargar los datos del perfil.");
    }
}