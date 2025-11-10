document.addEventListener("DOMContentLoaded", () => {
  const botonVerMascotas = document.getElementById("botonVerMascotas");
  const ventana = document.getElementById("ventanaMascotas");
  const cerrarVentana = document.getElementById("cerrarVentana");
  const contenedor = document.getElementById("contenedorPublicaciones");

  botonVerMascotas.addEventListener("click", () => {
    ventana.style.display = "flex";
  });
  cerrarVentana.addEventListener("click", () => {
    ventana.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === ventana) ventana.style.display = "none";
  });

  const mascotas = [
    {
      id: 1,
      tipoUsuario: "@refugioAmigosPeludos",
      nombre: "🐶 Juan busca hogar",
      imagen: "img/perro-1.jpg",
      descripcion: "Perro cariñoso, juguetón y obediente. Ideal para familias con niños.",
      requisitos: "Tener espacio al aire libre y disponibilidad para paseos diarios.",
      estado: "no-adoptado"
    },
    {
      id: 2,
      tipoUsuario: "@usuarioMarta",
      nombre: "🐱 Luna busca hogar",
      imagen: "img/gato-1.jpg",
      descripcion: "Gatita muy dulce, ya esterilizada y con vacunas al día.",
      requisitos: "Tener espacio en el domicilio y disponibilidad para llevarla al veterinario.",
      estado: "no-adoptado"
    }
  ];

  mascotas.forEach(mascota => {
    const publicacion = document.createElement("div");
    publicacion.classList.add("publicacion");
    publicacion.innerHTML = `
      <div class="tarjeta-lado-izquierdo">
        <div class="imagen-publicacion">
          <div class="barra-usuario">${mascota.tipoUsuario}</div>
          <img src="${mascota.imagen}" alt="${mascota.nombre}">
        </div>
        <div class="separador-horizontal"></div>
        <button class="boton-adoptar" data-id="${mascota.id}">Adoptar</button>
      </div>
      <div class="separador-vertical"></div>
      <div class="contenido-publicacion">
        <h2 class="titulo-publicacion">${mascota.nombre}</h2>
        <p><strong>Descripción:</strong> ${mascota.descripcion}</p>
        <p><strong>Requisitos:</strong> ${mascota.requisitos}</p>
        <div class="estado-contenedor">
          <label>Estado:</label>
          <select class="estado-seleccion" data-id="${mascota.id}">
            <option value="no-adoptado" ${mascota.estado === "no-adoptado" ? "selected" : ""}>❌ No adoptado</option>
            <option value="pendiente" ${mascota.estado === "pendiente" ? "selected" : ""}>⏳ Pendiente</option>
            <option value="adoptado" ${mascota.estado === "adoptado" ? "selected" : ""}>✅ Adoptado</option>
          </select>
          <p class="mensaje-estado">🏠 Este animal aún busca un hogar.</p>
        </div>
      </div>
    `;

    contenedor.appendChild(publicacion);
    const seleccion = publicacion.querySelector(".estado-seleccion");
    const mensaje = publicacion.querySelector(".mensaje-estado");

    seleccion.addEventListener("change", () => {
      const valor = seleccion.value;
      if (valor === "adoptado") {
        mensaje.textContent = "🥰 ¡Este animal ya fue adoptado!";
        mensaje.style.color = "green";
      } else if (valor === "pendiente") {
        mensaje.textContent = "⏳ La adopción está pendiente.";
        mensaje.style.color = "orange";
      } else {
        mensaje.textContent = "🏠 Este animal aún busca un hogar.";
        mensaje.style.color = "red";
      }
    });
    if (mascota.estado === "no-adoptado") {
        mensaje.textContent = "🏠 Este animal aún busca un hogar.";
        mensaje.style.color = "red";
    }
  });

  contenedor.addEventListener("click", e => {
    if (e.target.classList.contains("boton-adoptar")) {
      const id = e.target.getAttribute("data-id");
      const seleccion = document.querySelector(`.estado-seleccion[data-id="${id}"]`);
      const mensaje = seleccion.closest(".estado-contenedor").querySelector(".mensaje-estado");
      const boton = e.target;

      seleccion.value = "pendiente";
      mensaje.textContent = "⏳ Solicitud de adopción enviada.";
      mensaje.style.color = "#ff9800";

      boton.textContent = "Pendiente";
      boton.disabled = true;
    }
  });
});