const usuario = {
    id: 1,
    nombre: "Juan Pérez",
    nickname: "Dragon1234",
    contrasenia: "dragon",
    email: "jperez@gmail.com",
    nacimiento: "2005-02-14",
    ciudad: "Buenos Aires",
    biografia: "Me encantan los animales",
    foto: "../images/gato-1.jpg"
};

const amigos = [
    { id: 2, nickname: "Luna1234"},
    { id: 3, nickname: "MichiLover"},
    { id: 4, nickname: "DoggyLove"}
];

const mascotas = [
    { id: 1, nombre: "Toby", img: "../images/perro-1.jpg" },
    { id: 2, nombre: "Michi", img: "../images/perro-1.jpg" }
];

const publicaciones = [
    { id: 1, img: "../images/publicacion-ejemplo.webp", desc: "Día en el parque 🐕" },
    { id: 2, img: "../images/publicacion-ejemplo.webp", desc: "Michi durmiendo 😴" }
];


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


function actualizarTotales() {
    totalAmigos.textContent = amigos.length;
    totalMascotas.textContent = mascotas.length;
    totalPublicaciones.textContent = publicaciones.length;
}

function renderPerfil() {
    document.getElementById("fotoPerfil").src = usuario.foto;
    document.getElementById("nombre").textContent = `Nombre: ${usuario.nombre}`;
    document.getElementById("nickname").textContent = `Nickname: ${usuario.nickname}`;
    document.getElementById("contrasenia").textContent = `Contraseña: ${"*".repeat(usuario.contrasenia.length)}`;
    document.getElementById("email").textContent = `Email: ${usuario.email}`;
    document.getElementById("nacimiento").textContent = `Nacimiento: ${usuario.nacimiento}`;
    document.getElementById("ciudad").textContent = `Ciudad: ${usuario.ciudad}`;
    document.getElementById("biografia").textContent = `Biografia: ${usuario.biografia}`;
}

function renderAmigos() {
    listaAmigos.innerHTML = "";
    if (amigos.length === 0) {
        listaAmigos.innerHTML = "<p>Aun no tienes amigos</p>";
        return;
    }
    amigos.forEach((amigo) => {
        const li = document.createElement("li");
        li.className = "amigoItem";
        li.dataset.id = amigo.id;
        li.innerHTML = `
            <div class="amigoContenedor">
                <span class="amigoNombre">${amigo.nickname}</span>
                <button class="eliminarAmigo" title="Eliminar amigo">🗑 Eliminar</button>
            </div>
        `;
        li.querySelector(".eliminarAmigo").addEventListener("click", (e) => {
            const id = parseInt(e.target.closest(".amigoItem").dataset.id);
            const index = amigos.findIndex(a => a.id === id);
            if (index !== -1) {
                amigos.splice(index, 1);
                renderAmigos();
                actualizarTotales();
            }
        });
        listaAmigos.appendChild(li);
    });
}


function renderMascotas() {
    galeriaMascotas.innerHTML = "";
    if (mascotas.length === 0) {
        galeriaMascotas.innerHTML = "<p>Aun no tienes mascotas</p>";
        return;
    }
    mascotas.forEach((mascota) => {
        const div = document.createElement("div");
        div.className = "mascota";
        div.dataset.id = mascota.id;
        div.innerHTML = `
            <img src="${mascota.img}" alt="${mascota.nombre}">
            <p>${mascota.nombre}</p>
            <button class="eliminarMascota" title="Eliminar mascota">🗑 Eliminar</button>
        `;
        div.querySelector(".eliminarMascota").addEventListener("click", (e) => {
            const id = parseInt(e.target.closest(".mascota").dataset.id);
            const index = mascotas.findIndex(m => m.id === id);
            if (index !== -1) {
                mascotas.splice(index, 1);
                renderMascotas();
                actualizarTotales();
            }
        });
        galeriaMascotas.appendChild(div);
    });
}


function renderPublicaciones() {
    galeriaPublicaciones.innerHTML = "";
    if (publicaciones.length === 0) {
        galeriaPublicaciones.innerHTML = "<p>Aun no tienes publicaciones</p>";
        return;
    }
    publicaciones.forEach(publi => {
        const div = document.createElement("div");
        div.className = "publicacion";
        div.dataset.id = publi.id;
        div.innerHTML = `
            <button class="eliminarBoton" title="Eliminar publicación">🗑</button>
            <img src="${publi.img}" alt="Publicación">
            <p>${publi.desc}</p>
        `;
        div.querySelector(".eliminarBoton").addEventListener("click", (e) => {
            const id = parseInt(e.target.closest(".publicacion").dataset.id);
            const index = publicaciones.findIndex(p => p.id === id);
            if (index !== -1) {
                publicaciones.splice(index, 1);
                renderPublicaciones();
                actualizarTotales();
            }
        });
        galeriaPublicaciones.appendChild(div);
    });
}



botonEditar.addEventListener("click", () => {
    document.getElementById("inputNombre").value = usuario.nombre;
    document.getElementById("inputNickname").value = usuario.nickname;
    document.getElementById("inputContrasenia").value = usuario.contrasenia;
    document.getElementById("inputEmail").value = usuario.email;
    document.getElementById("inputNacimiento").value = usuario.nacimiento;
    document.getElementById("inputCiudad").value = usuario.ciudad;
    document.getElementById("inputBiografia").value = usuario.biografia;
    modalEditar.style.display = "flex";
});

botonCerrarEditar.addEventListener("click", () => modalEditar.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modalEditar) modalEditar.style.display = "none";
});

formMascota.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombreMascota").value.trim();
    if (!nombre) return;
    const nuevoId = mascotas.length ? mascotas[mascotas.length - 1].id + 1 : 1;
    mascotas.push({ id: nuevoId, nombre, img: "../images/perro-1.jpg" });
    renderMascotas();
    actualizarTotales();
    formMascota.reset();
});

formPerfil.addEventListener("submit", (e) => {
    e.preventDefault();
    usuario.nombre = document.getElementById("inputNombre").value;
    usuario.nickname = document.getElementById("inputNickname").value;
    usuario.contrasenia = document.getElementById("inputContrasenia").value;
    usuario.email = document.getElementById("inputEmail").value;
    usuario.nacimiento = document.getElementById("inputNacimiento").value;
    usuario.ciudad = document.getElementById("inputCiudad").value;
    usuario.biografia = document.getElementById("inputBiografia").value;
    renderPerfil();
    modalEditar.style.display = "none";
});


renderPerfil();
renderAmigos();
renderMascotas();
renderPublicaciones();
actualizarTotales();