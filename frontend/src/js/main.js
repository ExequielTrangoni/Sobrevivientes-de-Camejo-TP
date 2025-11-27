const URL_API = 'http://localhost:3000/api/publicaciones';
const galeria = document.querySelector(".galeria");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("cerrar-modal");
const commentsContainer = document.getElementById("conteiner-comentarios");

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

        const imagenSrc = "../images/publicacion-ejemplo.webp"; 

        div.innerHTML = `
            <div class="publicacion-header">
                👤 ${pub.nombre_usuario || 'Usuario'} 
                <span style="font-size:0.8em; float:right">
                    ${new Date(pub.fecha_publicacion).toLocaleDateString()}
                </span>
            </div>
            <img src="${imagenSrc}" alt="Publicación">
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
    commentsContainer.innerHTML = `
        <p><strong>Comentarios sobre mascota de ${usuario}:</strong></p>
        <p>¡Qué lindo! 😍</p>
    `;
    modal.style.display = "flex";
}

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });