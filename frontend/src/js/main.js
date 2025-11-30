const URL_API = 'http://localhost:3000/api/publicaciones';
const galeria = document.querySelector(".galeria");
const modal = document.getElementById("modal");
const quitarModal = document.getElementById("cerrar-modal-comentarios");
const conteinerComentarios = document.getElementById("conteiner-comentarios");

const btnAbrirCrear = document.getElementById('boton-abrir-publi');
const modalCrear = document.getElementById('modal-crear');
const btnCerrarCrear = document.getElementById('cerrar-modal-publicacion');
const selectMascota = document.getElementById('select-mascota');
const formPublicacion = document.getElementById('form-publicacion');

const modalAlerta = document.getElementById('modal-alerta-login');

let todasLasPublicaciones = [];
let indiceActual = 0;
const CANTIDAD_POR_TANDA = 6;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await fetch(URL_API);
        if (!respuesta.ok) throw new Error('Error al conectar con Backend');
        
        todasLasPublicaciones = await respuesta.json();
        cargarMasPublicaciones();
    } catch (error) {
        console.error("Error API:", error);
        galeria.innerHTML = "<p style='text-align:center; padding:20px;'>No se pudo conectar con el servidor.</p>";
    }
});

function cargarMasPublicaciones() {
    if (indiceActual >= todasLasPublicaciones.length) return;

    const siguientes = todasLasPublicaciones.slice(indiceActual, indiceActual + CANTIDAD_POR_TANDA);
    
    siguientes.forEach(pub => {
        const div = document.createElement("div");
        div.className = "publicacion";

        const imagenSrc = `http://localhost:3000/uploads/${pub.imagen_publicacion}`

        div.innerHTML = `
            <div class="publicacion-header">
                👤 ${pub.nombre_usuario || 'Usuario'} 
                <span style="font-size:0.8em; float:right">
                    ${new Date(pub.fecha_publicacion).toLocaleDateString()}
                </span>
            </div>
            <img src="${imagenSrc}" onerror="this.onerror=null;this.src='/src/images/publicacion-ejemplo.jpg';" alt="Publicación" style="max-width: 100%; height: auto;">
            <div class="publicacion-descripcion">
                <strong>${pub.titulo}</strong><br>
                ${pub.descripcion}
            </div>
            <div class="publicacion-footer">
                <span>📍 ${pub.ubicacion}</span>
                <span class="comentariosBtn" style="cursor:pointer">💬 Ver comentarios</span>
            </div>
        `;
        div.querySelector(".comentariosBtn").addEventListener("click", () => {
            abrirModal(pub.nombre_usuario);
        });

        galeria.appendChild(div);
    });
    indiceActual += siguientes.length;
}

window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        cargarMasPublicaciones();
    }
});

function abrirModal(usuario) {
    conteinerComentarios.innerHTML = `
        <p><strong>Comentarios sobre mascota de ${usuario}:</strong></p>
        <p>¡Qué lindo! 😍</p>
    `;
    modal.style.display = "flex";
}

quitarModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

if (btnAbrirCrear) {
    btnAbrirCrear.addEventListener('click', async () => {
        
        const usuarioLogueado = localStorage.getItem('usuarioId');

        if (!usuarioLogueado) {
            if (modalAlerta) modalAlerta.style.display = 'flex';
            return; 
        }

        if (modalCrear) modalCrear.style.display = 'flex';

        try {
            const res = await fetch(`http://localhost:3000/api/mascotas/usuario/${usuarioLogueado}`);
            
            if (!res.ok) throw new Error("Error al traer mascotas");
            
            const mascotas = await res.json();
    
            if (selectMascota) {
                selectMascota.innerHTML = '<option value="">Seleccioná una mascota...</option>';
                mascotas.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m.id;
                    option.textContent = m.nombre;
                    selectMascota.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error cargando mascotas:", error);
            if(selectMascota) selectMascota.innerHTML = '<option>Error al cargar</option>';
        }
    });
}

if (btnCerrarCrear) {
    btnCerrarCrear.addEventListener('click', () => {
        if (modalCrear) modalCrear.style.display = 'none';
    });
}

window.cerrarModalLogin = () => {
    if (modalAlerta) modalAlerta.style.display = 'none';
};

window.addEventListener("click", (e) => { 
    if (modalAlerta && e.target === modalAlerta) modalAlerta.style.display = "none";
    if (modalCrear && e.target === modalCrear) modalCrear.style.display = "none";
    if (modal && e.target === modal) modal.style.display = "none";
});

if (formPublicacion) {
    formPublicacion.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('input-imagen');
        const formData = new FormData();

        formData.append('titulo', document.getElementById('input-titulo').value);
        formData.append('descripcion', document.getElementById('input-desc').value);
        formData.append('ubicacion', document.getElementById('input-ubicacion').value);
        formData.append('mascota_id', selectMascota.value);
        
        if (fileInput.files.length > 0) {
            formData.append('imagen_publicacion', fileInput.files[0]);
        }

        try {
            const res = await fetch('http://localhost:3000/api/publicaciones', {
                method: 'POST',
                body: formData 
            });

            if (res.ok) {
                alert('¡Publicado con éxito!');
                location.reload();
            } else {
                alert('Error al publicar');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    });
}

const btnLogout = document.getElementById('btn-logout');

if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuarioId');
        alert('Sesión cerrada correctamente 👋');
        window.location.reload();
    });
}

const usuarioLogueado = localStorage.getItem('usuarioId');
if (!usuarioLogueado && btnLogout) {
    btnLogout.style.display = 'none';
}