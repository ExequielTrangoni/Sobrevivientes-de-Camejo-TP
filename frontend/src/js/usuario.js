const API_USUARIO = "http://localhost:3000/api/usuarios";
const API_MASCOTAS = "http://localhost:3000/api/mascotas";
const API_PUBLICACIONES = "http://localhost:3000/api/publicaciones";
const BACKEND = "http://localhost:3000";
const API_URL = "http://localhost:3000/api";
const RUTA_FOTOS = "http://localhost:3000/uploads/";


let usuario = {};
let amigos = [];
let mascotas = [];
let publicaciones = [];
let solicitudes = [];

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
const modalMascota = document.getElementById("modalMascota");
const cerrarFormMascota = document.getElementById("cerrarFormMascota");
const modalPublicacion = document.getElementById('modalPublicacion');
const cerrarFormPublicacion = document.getElementById('cerrarFormPublicacion');
const botonAbrirPublicacion = document.getElementById('botonAbrirFormPublicacion');
const formPublicacion = document.getElementById('formPublicacion');
const selectMascota = document.getElementById('pubMascota');

const params = new URLSearchParams(window.location.search);
const perfilId = params.get("usuarioId");
const mostrarId = perfilId || getUsuarioId();

const botonLogout = document.getElementById('botonLogout');

document.addEventListener("DOMContentLoaded", async () => {
    const seccionBienvenida = document.querySelector(".seccionBienvenida");
    const mainPerfil = document.querySelector("main.usuarioPerfil");
    const usuarioId = getUsuarioId();

    if (!usuarioId) {
        seccionBienvenida.style.display = "block";
        mainPerfil.style.display = "none";
        return;
    }

    seccionBienvenida.style.display = "none";
    mainPerfil.style.display = "";
    await initPerfil();
});

botonAbrirPublicacion.addEventListener('click', () => {
    modalPublicacion.style.display = 'flex';
    selectMascota.innerHTML = '';
    mascotas.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.nombre;
        selectMascota.appendChild(opt);
    });
});

cerrarFormPublicacion.addEventListener('click', () => {
    modalPublicacion.style.display = 'none'
});
window.addEventListener('click', e => {
    if(e.target === modalPublicacion) modalPublicacion.style.display = 'none';
});

botonAbrirFormMascota.addEventListener('click', () => {
    modalMascota.style.display = 'flex';
});

cerrarFormMascota.addEventListener('click', () => {
    modalMascota.style.display = 'none';
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
        const esPerfilPropio = mostrarId == getUsuarioId();
        renderPerfil(esPerfilPropio);

        document.getElementById("botonEditarPerfil").style.display = esPerfilPropio ? 'block' : 'none';
        document.querySelectorAll('#formPerfil input').forEach(input => input.disabled = !esPerfilPropio);

        const botonAmigo = document.getElementById("botonAgregarAmigo");
        botonAmigo.style.display = esPerfilPropio ? 'none' : 'block';

        if(botonAbrirFormMascota) botonAbrirFormMascota.style.display = esPerfilPropio ? 'block' : 'none';
        if(formMascota) formMascota.style.display = esPerfilPropio ? 'block' : 'none';

        if (!esPerfilPropio) {
            const estado = await obtenerEstadoAmistad();
            manejarBotonAmistad(botonAmigo, estado);
        }
    } catch (err) {
        console.error('Error al cargar perfil:', err);
    }
}

function renderPerfil() {
    const esPerfilPropio = mostrarId == getUsuarioId();

    const fotoURL = usuario.imagen_usuario
        ? `${BACKEND}/uploads/${usuario.imagen_usuario}`
        : "../images/gato-1.jpg";

    document.getElementById("fotoPerfil").src = fotoURL;
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
    document.getElementById("nacimiento").textContent = usuario.nacimiento
        ? `Nacimiento: ${usuario.nacimiento}`
        : "Nacimiento: ";
    document.getElementById("ciudad").textContent = `Ciudad: ${usuario.ciudad || ''}`;
    document.getElementById("biografia").textContent = `Biografía: ${usuario.biografia || ''}`;
}

function manejarBotonAmistad(boton, estado) {
    const contenedor = document.getElementById("zonaSolicitudesPerfil");
    contenedor.innerHTML = '';

    switch(estado) {
        case "amigos":
            boton.style.display = "none";
            break;
        case "pendiente-enviada":
            boton.style.display = "block";
            boton.textContent = "Solicitud enviada";
            boton.disabled = true;
            break;
        case "pendiente-recibida":
            boton.style.display = "none";
            contenedor.innerHTML = `
                <button class="boton botonSecundario" id="botonAceptarPerfil">Aceptar solicitud</button>
                <button class="boton botonEliminar" id="botonRechazarPerfil">Rechazar solicitud</button>
            `;
            document.getElementById("botonAceptarPerfil").onclick = async () => {
                await aceptarSolicitud(mostrarId);
                contenedor.innerHTML = '';
            };
            document.getElementById("botonRechazarPerfil").onclick = async () => {
                await rechazarSolicitud(mostrarId);
                boton.style.display = "block";
                boton.textContent = "Agregar amigo";
                boton.disabled = false;
                contenedor.innerHTML = '';
            };
            break;
        case "ninguna":
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
                    body: JSON.stringify({ usuarioId: getUsuarioId(), amigoId: mostrarId })
                });

                if (!res.ok) {
                    alert("Error al enviar la solicitud");
                    boton.disabled = false;
                    boton.textContent = "Agregar amigo";
                    return;
                }
                const estado = await obtenerEstadoAmistad();
                manejarBotonAmistad(boton, estado);

                await cargarSolicitudes();
                await cargarAmigos();
            };
            break;
    }
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
    const esPerfilPropio = mostrarId == getUsuarioId();

    if (!amigos.length) {
        return listaAmigos.innerHTML = `<p>${esPerfilPropio ? 'No tienes amigos' : 'No hay amigos'}</p>`;
    }

    amigos.forEach(amigo => {
        const div = document.createElement('div');
        div.className = 'tarjeta amigoItem';
        div.innerHTML = `
            <img class="imgRedonda" src="${amigo.imagen_usuario ? `${BACKEND}/uploads/${amigo.imagen_usuario}` : '../images/gato-1.jpg'}" alt="${amigo.nombre}">
            <h4 class="textoCompacto">${linkPerfil(amigo.id, amigo.nombre)}</h4>
            ${esPerfilPropio ? '<button class="boton botonEliminar">🗑</button>' : ''}
        `;
        if (esPerfilPropio) {
            div.querySelector('.botonEliminar').addEventListener('click', async () => {
                if(!confirm("¿Seguro que deseas eliminar a este amigo?")) return;
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
        const res = await fetch(`${API_MASCOTAS}/usuario/${mostrarId}`, {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
        });
        mascotas = await res.json();
        renderMascotas();
    } catch (err) {
        console.error('Error al cargar mascotas:', err);
    }
}

function renderMascotas() {
    galeriaMascotas.innerHTML = '';
    const esPerfilPropio = mostrarId == getUsuarioId();

    if (!mascotas.length) {
        return galeriaMascotas.innerHTML = `<p>${esPerfilPropio ? 'No tienes mascotas' : 'No hay mascotas'}</p>`;
    }

    mascotas.forEach(m => {
        const div = document.createElement('div');
        div.className = 'tarjeta mascotaItem';
        div.innerHTML = `
            <img class="imgRedonda" src="${m.imagen_mascota ? `${BACKEND}/uploads/${m.imagen_mascota}` : '../images/perro-1.jpg'}" alt="${m.nombre}">
            <p class="textoCompacto">${m.nombre}</p>
            ${esPerfilPropio ? '<button class="boton botonEliminar">🗑</button>' : ''}
        `;
        if (esPerfilPropio) {
            div.querySelector('.botonEliminar').addEventListener('click', async () => {
                if (!confirm("¿Seguro que deseas eliminar esta mascota?\nSe borraran todas las publicaciones de esta mascota")) return;
                await fetch(`${API_MASCOTAS}/${m.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: "Bearer " + localStorage.getItem('token') }
                });
                await cargarMascotas();
                await cargarPublicaciones();
                actualizarTotales();
            });
        }
        galeriaMascotas.appendChild(div);
    });
    actualizarTotales();
}

async function cargarPublicaciones() {
    try {
        const res = await fetch(`${API_PUBLICACIONES}/usuario/${mostrarId}`, {
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
    const esPerfilPropio = mostrarId == getUsuarioId();

    const botonAgregar = document.getElementById('botonAbrirFormPublicacion');
    if (botonAgregar) botonAgregar.style.display = esPerfilPropio ? 'block' : 'none';

    if (!publicaciones || publicaciones.length === 0) {
        return galeriaPublicaciones.innerHTML = `<p>${esPerfilPropio ? 'No tienes publicaciones' : 'No hay publicaciones'}</p>`;
    }
    publicaciones.forEach(p => {
        const fecha = new Date(p.fecha_publicacion).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const div = document.createElement('div');
        div.className = 'publicacion';
        div.innerHTML = `
            ${esPerfilPropio ? '<button class="boton botonEliminar">🗑</button>' : ''}
            <img src="${BACKEND}/uploads/${p.imagen_publicacion}" alt="${p.titulo}">
            <h4>${p.titulo}</h4>
            <p>${p.descripcion}</p>
            <small>Ubicación: ${p.ubicacion}</small>
            <small>Fecha: ${fecha}</small>
        `;

        if (esPerfilPropio) {
            div.querySelector('.botonEliminar').addEventListener('click', async () => {
                if(!confirm('¿Eliminar publicación?')) return;
                await fetch(`${API_PUBLICACIONES}/${p.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
                });
                await cargarPublicaciones();
                actualizarTotales();
            });
        }
        galeriaPublicaciones.appendChild(div);
    });
    actualizarTotales();
}


formPublicacion.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formPublicacion);

    try {
        const res = await fetch(API_PUBLICACIONES, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(err);
            alert('Error al crear publicación');
            return;
        }

        await cargarPublicaciones();
        actualizarTotales();
        formPublicacion.reset();
        modalPublicacion.style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('No se pudo agregar la publicación');
    }
});


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

botonCerrarEditar.addEventListener('click', () => {
    modalEditar.style.display = 'none'
});

window.addEventListener('click', e => {
    if (e.target === modalEditar) modalEditar.style.display = 'none';
});

formPerfil.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formPerfil);

    try {
        await fetch(`${API_USUARIO}/${getUsuarioId()}`, {
            method: 'PUT',
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
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
        const contenedorSolicitudes = document.getElementById("solicitudesContainer");

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
        lista.innerHTML = '<p>No tienes solicitudes de amistad</p>';
    } else {
        solicitudes.forEach(solicitud => {
            const li = document.createElement('li');
            li.className = 'tarjeta solicitudItem';
            li.innerHTML = `
                <img class="imgRedonda" src="${solicitud.imagen_usuario ? `${BACKEND}/uploads/${solicitud.imagen_usuario}` : '../images/gato-1.jpg'}" alt="${solicitud.nombre}">
                <h4 class="textoCompacto">
                    ${linkPerfil(solicitud.id, solicitud.nombre)}
                </h4>

                <div>
                    <button class="boton botonSecundario aceptarBoton">Aceptar</button>
                    <button class="boton botonEliminar rechazarBoton">Rechazar</button>
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

        const boton = document.getElementById("botonAgregarAmigo");
        if (boton) {
            const estado = await obtenerEstadoAmistad();
            manejarBotonAmistad(boton, estado);
        }
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
        await cargarAmigos();

        const boton = document.getElementById("botonAgregarAmigo");
        if (boton) {
            const estado = await obtenerEstadoAmistad();
            manejarBotonAmistad(boton, estado);
        }
    } catch (err) {
        console.error('Error rechazar solicitud:', err);
    }
}

formMascota.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(formMascota);

    try {
        await fetch(`${API_MASCOTAS}`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + localStorage.getItem('token')},
            body: formData
        });

        await cargarMascotas();
        actualizarTotales();
        formMascota.reset();
        document.getElementById('modalMascota').style.display = 'none';
    } catch (err) {
        console.error('Error al agregar mascota', err);
    }
});

if (botonLogout) {
    botonLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('usuarioId');
        alert('Sesión cerrada correctamente.');
        window.location.reload();
    });
}

if (!getUsuarioId() && botonLogout) {
    botonLogout.style.display = 'none';
}

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
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function cargarSolicitudes() {
    const contenedor = document.getElementById("contenedorSolicitudes");
    if (!contenedor) return;

    const headers = getAuthHeaders();
    if (!headers) {
        contenedor.innerHTML = "<p>Debes iniciar sesión para ver esto.</p>";
        return;
    }

    try {
        const req = await fetch(`${API_URL}/adopciones/recibidas`, { headers });
        
        if (!req.ok) throw new Error("Error al cargar");

        const data = await req.json();
        
        if (data.length === 0) {
            contenedor.innerHTML = "<p>Nadie envió solicitudes todavía.</p>";
        } else {
            pintarSolicitudes(data, contenedor);
        }

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = "<p>Error de conexión al cargar solicitudes.</p>";
    }
}

function pintarSolicitudes(lista, contenedor) {
    contenedor.innerHTML = "";

    lista.forEach(item => {
        const div = document.createElement("div");
        div.className = "tarjeta-solicitud";

        const fotoPerfil = item.imagen_adoptante ? RUTA_FOTOS + item.imagen_adoptante :'../images/foto-perfil.jpg';

        let accionesHtml = '';
        if (item.estado === 'pendiente') {
            accionesHtml = `
                <div class="acciones-soli">
                    <button class="btn-aceptar" data-id="${item.solicitud_id}" data-accion="aceptada">Aceptar</button>
                    <button class="btn-rechazar" data-id="${item.solicitud_id}" data-accion="rechazada">Rechazar</button>
                </div>
            `;
        } else {
            accionesHtml = `<p class="estado-lbl">Estado: <b>${item.estado.toUpperCase()}</b></p>`;
        }

        div.innerHTML = `
            <div class="soli-header">
                <img src="${fotoPerfil}" alt="Foto perfil" class="foto-adoptante">
                <div class="soli-info">
                    <h4>${item.nombre_adoptante}</h4>
                    <span>Interesado en: <b>${item.nombre_mascota}</b></span>
                </div>
            </div>
            <div class="soli-body">
                <p>"${item.mensaje_solicitud || ''}"</p>
                <div class="contacto-info">
                    <span>${item.email_adoptante}</span>
                    <span>${item.telefono_adoptante}</span>
                </div>
                <small class="fecha">${new Date(item.fecha_solicitud).toLocaleDateString()}</small>
            </div>
            ${accionesHtml}
        `;

        contenedor.appendChild(div);
    });
}

async function manejarAccionSolicitud(id, accion) {
    if (!confirm(`¿Confirmás que querés ${accion === 'aceptada' ? 'aceptar' : 'rechazar'} esta solicitud?`)) return;

    const headers = getAuthHeaders();
    
    try {
        const res = await fetch(`${API_URL}/adopciones/${id}/estado`, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify({ estado: accion })
        });

        if (res.ok) {
            alert(`Solicitud ${accion} correctamente.`);
            cargarSolicitudes();
        } else {
            const err = await res.json();
            alert(err.error || "Error al actualizar.");
        }
    } catch (error) {
        console.error(error);
        alert("Error de red.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarSolicitudes();
    const contenedor = document.getElementById("contenedorSolicitudes");
    
    if (contenedor) {
        contenedor.addEventListener("click", (e) => {
            if (e.target.tagName === "BUTTON" && e.target.dataset.id) {
                const { id, accion } = e.target.dataset;
                manejarAccionSolicitud(id, accion);
            }
        });
    }
});