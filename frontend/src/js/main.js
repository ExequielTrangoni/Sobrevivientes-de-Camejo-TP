let page = 1;
const galeria = document.querySelector(".galeria");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("cerrar-modal");
const commentsContainer = document.getElementById("conteiner-comentarios");

function cargarPublicaciones() {
    for (let i = 1; i <= 6; i++) {
        const div = document.createElement("div");
        div.className = "publicacion";

        const usuario = "@usuario";
        const likes = 1;
        const comments = 1;

        div.innerHTML = `
            <div class="publicacion-header">${usuario}</div>
            <img src="../images/publicacion-ejemplo.webp" alt="Publicación">
            <p class="publicacion-descripcion">
            Acá va a ir la descripcion
            </p>
            <div class="publicacion-footer">
                <span class="likes">❤️ ${likes} likes</span>
                <span class="comentariosBtn">💬 ${comments} comentarios</span>
            </div>
        `;

        div.querySelector(".comentariosBtn").addEventListener("click", () => {
            abrirModal(usuario);
        });

        galeria.appendChild(div);
    }
}

window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        cargarPublicaciones();
    }
});

function abrirModal(usuario) {
    commentsContainer.innerHTML = `
        <p><strong>Comentarios de ${usuario}:</strong></p>
        <p>Hermosa mascota 🐶</p>
        <p>¿Está en adopción?</p>
        <p>Me encantó 😍</p>
    `;
    modal.style.display = "flex";
}

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

cargarPublicaciones();
