document.addEventListener("DOMContentLoaded", async () => {

  const API_PUBLICACIONES = "http://localhost:3000/api/publicaciones_adopciones";
  const API_ADOPCIONES = "http://localhost:3000/api/adopciones";
  const contenedor = document.getElementById("contenedorPublicaciones");

  const ventana = document.getElementById("ventanaMascotas");
  const cerrarVentana = document.getElementById("cerrarVentana");
  const botonVerMascotas = document.getElementById("botonVerMascotas");
  const botonesOpcion = document.querySelectorAll(".opcion");
  const modal = document.getElementById("modalUsuario");
  const modalContenido = document.getElementById("modalContenido");
  const btnCrear = document.getElementById("btnCrearPublicacion");
  const modalCrear = document.getElementById("modalCrearPublicacion");
  const cerrarModalCrear = document.getElementById("cerrarModalCrear");
  const selectMascota = document.getElementById("selectMascota");
  const formCrear = document.getElementById("formCrearPublicacion");

  async function obtenerUsuarioActual() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    try {
      const resultado = await fetch("http://localhost:3000/api/autor/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!resultado.ok) return null;
      return await resultado.json();
    } catch {
      return null;
    }
  }


  const usuarioActual = await obtenerUsuarioActual();

  async function obtenerPublicaciones() {
    const res = await fetch(API_PUBLICACIONES);
    return await res.json();
  }

  async function obtenerSolicitudesUsuario() {
    if (!usuarioActual) return [];
    try {
      const res = await fetch(`${API_ADOPCIONES}/usuario/${usuarioActual.id}`);
      if (!res.ok) return [];
      const data =  await res.json();
      const mapa = {};
      data.forEach(solicitud => {
        mapa[solicitud.publicacion_adopciones_id] = solicitud;
      });
      return mapa;
    } catch {
      return [];
    }
  }

  async function crearSolicitud(publicacion_adopciones_id) {

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para adoptar");
      return null;
    }

    const res = await fetch(API_ADOPCIONES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        publicacion_adopciones_id,
        mensaje_solicitud: "Quiero adoptar esta mascota",
      })
    });

    return await res.json();
  }

  async function actualizarSolicitud(id, estado) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_ADOPCIONES}/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    return await res.json();
  }


  async function mostrarPublicaciones(publicaciones, solicitudesMapa = {}) {
    contenedor.innerHTML = "";

    for (const pub of publicaciones) {

      const solicitud = solicitudesMapa[pub.publicacion_adopciones_id] || null;

      const div = document.createElement("div");
      div.classList.add("publicacion");
       
      let img = '../images/imagen-otro.jpg';
      if (pub.especie.toLowerCase() === 'perro') img = '../images/imagen-perro.jpg';
      else if (pub.especie.toLowerCase() === 'gato') img = '../images/imagen-gato.jpg';

      let emoji = '🐾';
      if (pub.especie.toLowerCase() === 'perro') emoji = '🐶';
      else if (pub.especie.toLowerCase() === 'gato') emoji = '🐱';


      div.innerHTML = `
        <img src="${pub.imagen_publicacion || pub.imagen_mascota  || img}" class="img">
        <h3>${emoji} ${pub.nombre_mascota} busca hogar</h3>
        <p><strong>Descripción:</strong> ${pub.descripcion}</p>
        <p><strong>Requisitos:</strong> ${pub.requisitos}</p>
        <p><strong>Publicado por:</strong>
          <span class="nombre-usuario-click" data-id="${pub.usuario_id}" data-publicacion-id="${pub.publicacion_adopciones_id}">
            Ver dueño
          </span>
        </p>
        <p><strong>Estado:</strong> ${pub.estado_mascota}</p>
        <div class="acciones"></div>
      `;

      const acciones = div.querySelector(".acciones");

  
      if (!usuarioActual) {
        acciones.innerHTML = `<p>Inicia sesión para adoptar</p>`;
      }

      else if (solicitud) {
        if (solicitud.adoptante_id === usuarioActual.id) {

          if (solicitud.estado === "pendiente") {
            acciones.innerHTML = `<p>⏳ Tu solicitud está pendiente</p>`;
          }

          if (solicitud.estado === "aceptada") {
            acciones.innerHTML = `<p>🥳 ¡Fuiste aceptado!</p>`;
          }

          if (solicitud.estado === "rechazada") {
            acciones.innerHTML = `<p>❌ Tu solicitud fue rechazada</p>`;
          }
        }
        else if (usuarioActual.id === pub.usuario_id && solicitud.estado === "pendiente") {
          acciones.innerHTML = `
            <button class="boton-aceptar">Aceptar</button>
            <button class="boton-rechazar">Rechazar</button>
          `;

          acciones.querySelector(".boton-aceptar")
            .addEventListener("click", async () => {
              await actualizarSolicitud(solicitud.id, "aceptada");
              const nuevasSolicitudes = await obtenerSolicitudesUsuario();
              mostrarPublicaciones(publicaciones, nuevasSolicitudes);
            });

          acciones.querySelector(".boton-rechazar")
            .addEventListener("click", async () => {
              await actualizarSolicitud(solicitud.id, "rechazada");
              const nuevasSolicitudes = await obtenerSolicitudesUsuario();
              mostrarPublicaciones(publicaciones, nuevasSolicitudes);
            });
        }

        else {
          acciones.innerHTML = `<p>Solicitud pendiente...</p>`;
        }

      }

      else if (pub.estado_mascota === "no-adoptado") {
        const boton = document.createElement("button");
        boton.textContent = "Adoptar";
        boton.addEventListener("click", async () => {
          await crearSolicitud(pub.publicacion_adopciones_id);
          const nuevasSolicitudes = await obtenerSolicitudesUsuario();
          mostrarPublicaciones(publicaciones, nuevasSolicitudes);
        });
        acciones.appendChild(boton);
      }
      else {
        acciones.innerHTML = `<p>🐾 Adoptado</p>`;
      }
      contenedor.appendChild(div);
    }
  }

  botonVerMascotas.addEventListener("click", () => {
    ventana.style.display = "flex";
  });

  cerrarVentana.addEventListener("click", () => {
    ventana.style.display = "none";
  });

  ventana.addEventListener("click", e => {
    if (e.target === ventana) ventana.style.display = "none";
  });

  botonesOpcion.forEach(btn => {
    btn.addEventListener("click", () => {
      const texto = btn.textContent.toLowerCase();
      let filtradas;
      if (texto.includes("perro")) {
        filtradas = publicaciones.filter(m => m.especie.toLowerCase() === "perro");
      } else if (texto.includes("gato")) {
        filtradas = publicaciones.filter(m => m.especie.toLowerCase() === "gato");
      } else {
        filtradas = publicaciones.filter(m => m.especie.toLowerCase() === "otro");
      }
      mostrarPublicaciones(filtradas);
      ventana.style.display = "none";
    });
  });

  document.addEventListener("click", async (e) => {

    if (e.target === modal) {
      modal.style.display = "none";
      return;
    }

    if (modalContenido.contains(e.target)) return;

    if (e.target.classList.contains("nombre-usuario-click")) {

      const userId = e.target.dataset.id;
      const publicacionId = e.target.dataset.publicacionId;

      const resUser = await fetch(`http://localhost:3000/api/usuarios/${userId}`);
      const usuario = await resUser.json();

      const pub = publicaciones.find(p => p.publicacion_adopciones_id == publicacionId);
      const especie = (pub.especie || 'otro').toLowerCase();
      const img = especie === 'perro' ? '../images/imagen-perro.jpg' : especie === 'gato' ? '../images/imagen-gato.jpg' : '../images/imagen-otro.jpg';

      document.getElementById("modalImgMascota").src = pub.imagen_mascota || img;
      document.getElementById("modalNombreMascota").textContent = pub.nombre_mascota;
      document.getElementById("modalRaza").textContent = pub.raza;
      document.getElementById("modalEdad").textContent = pub.edad + " años";
      document.getElementById("modalTamano").textContent = pub.tamanio;

      document.getElementById("modalImgUsuario").src = usuario.imagen_usuario || '../images/imagen-usuario.jpg';
      document.getElementById("modalUsuarioNombre").textContent = usuario.nombre_completo;
      document.getElementById("modalTelefono").textContent = usuario.telefono;
      document.getElementById("modalDireccion").textContent = usuario.direccion;

      modal.style.display = "flex";
    }
  });

btnCrear?.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión");
    return;
  }

  modalCrear.style.display = "flex";

  try {
    const res = await fetch("http://localhost:3000/api/mascotas/mis-mascotas", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error al traer mascotas");

    const mascotas = await res.json();
    selectMascota.innerHTML = '<option value="">Seleccioná una mascota...</option>';

    mascotas.forEach(m => {
      const option = document.createElement("option");
      option.value = m.id;
      option.textContent = m.nombre;
      selectMascota.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando mascotas:", error);
    selectMascota.innerHTML = '<option>Error al cargar mascotas</option>';
  }
});

if (cerrarModalCrear) {
  cerrarModalCrear.addEventListener('click', () => {
    if (modalCrear) modalCrear.style.display = 'none';
  });
}

formCrear?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión");
    return;
  }

  const formData = new FormData(formCrear);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("http://localhost:3000/api/publicaciones_adopciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      modalCrear.style.display = "none";

      const publicaciones = await obtenerPublicaciones();

      mostrarPublicaciones(publicaciones);
    } else {
      alert("Error al crear publicación");
    }

  } catch (error) {
    console.error("Error al crear publicación:", error);
    alert("No se pudo crear la publicación");
  }
});


  const publicaciones = await obtenerPublicaciones();
  const solicitudesMapa = await obtenerSolicitudesUsuario();
  mostrarPublicaciones(publicaciones, solicitudesMapa);
});