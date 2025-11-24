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
        todasLasPublicaciones = await respuesta.json();
        
        cargarMasPublicaciones();
    } catch (error) {
        console.error("Error con la API:", error);
        galeria.innerHTML = "<p style='text-align:center; padding:20px;'>Error al cargar publicaciones.</p>";
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
                👤 ${pub.nombre_usuario || 'Anónimo'} 
                <span style="font-weight:normal; font-size:0.8em; float:right">
                    ${new Date(pub.fecha_publicacion).toLocaleDateString()}
                </span>
            </div>
            
            <img src="${imagenSrc}" alt="Publicación">
            
            <div class="publicacion-descripcion">
                <strong>${pub.titulo}</strong><br>
                ${pub.descripcion}
            </div>
            
            <div class="publicacion-footer">
                <span class="likes" onclick="darLike(${pub.id}, this)" style="cursor:pointer">
                    ❤️ <span id="contador-likes-${pub.id}">${pub.likes || 0}</span> likes
                </span>
                <span class="comentariosBtn" style="cursor:pointer">
                    💬 Ver comentarios
                </span>
            </div>
        `;
        div.querySelector(".comentariosBtn").addEventListener("click", () => {
            abrirModal(pub.nombre_usuario, pub.titulo);
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

function abrirModal(usuario, titulo) {
    commentsContainer.innerHTML = `
        <p><strong>Comentarios sobre la publicación de ${usuario}:</strong></p>
        <hr style="margin: 10px 0">
        <p>👤 <strong>UsuarioRandom:</strong> Que linda mascota! 😍</p>
        <p>👤 <strong>OtroVecino:</strong> Sigue en adopción?</p>
        <p>👤 <strong>RefugioZonaNorte:</strong> Compartido! 🐾</p>
    `;
    modal.style.display = "flex";
}

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { 
    if (e.target === modal) modal.style.display = "none"; 
});

async function darLike(idPublicacion, elemento) {
    try {
        elemento.style.color = '#ff0015ff';
        await fetch(`http://localhost:3000/api/publicaciones/like/${idPublicacion}`, {
            method: 'PUT'
        });
        
        const spanContador = document.getElementById(`contador-likes-${idPublicacion}`);
        let cantidad = parseInt(spanContador.innerText);
        spanContador.innerText = cantidad + 1;
        
    } catch (error) {
        elemento.style.color = '';
        console.error("Error al dar like:", error);
    }
}