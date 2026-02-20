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
      const resultado = await fetch("http://localhost:3000/api/usuarios/me", {
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
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(API_PUBLICACIONES, {
        method: "GET",
        headers: headers
      });
      if (!res.ok) {
        console.warn("No se pudo obtener las publicaciones (Status:", res.status, ")");
        return []; 
      }
      return await res.json();
    } catch (error) {
      console.error("Error de conexión:", error);
      return [];
    }
  }

async function obtenerSolicitudesUsuario() {
    if (!usuarioActual) return {};
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_ADOPCIONES}/usuario/${usuarioActual.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
      });
      
      if (!res.ok) return {};
      
      const data = await res.json();
      const mapa = {};
      data.forEach(solicitud => {
        mapa[solicitud.publicacion_adopciones_id] = solicitud;
      });
      return mapa;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

async function crearSolicitud(idPublicacion, mensaje) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para adoptar");
      return null;
    }
    const bodyData = {
        publicacion_adopciones_id: idPublicacion,
        mensaje_solicitud: mensaje || "Estoy interesado en adoptar a esta mascota"
    };

    try {
        const res = await fetch(API_ADOPCIONES, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            alert(errorData.error || "Error al enviar solicitud");
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
        return null;
    }
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
    const URL_IMAGENES = "http://localhost:3000/uploads/";

    for (const pub of publicaciones) {

      const solicitud = solicitudesMapa[pub.publicacion_adopciones_id] || null;

      const div = document.createElement("div");
      div.classList.add("publicacion");
       
      let imgSrc;

      if (pub.imagen_publicacion && pub.imagen_publicacion !== "null") {
          imgSrc = URL_IMAGENES + pub.imagen_publicacion;
      } 
      else if (pub.imagen_mascota && pub.imagen_mascota !== "null") {
          imgSrc = URL_IMAGENES + pub.imagen_mascota;
      } 
      else {
          const especie = (pub.especie || 'otro').toLowerCase();
          if (especie === 'perro') imgSrc = '../images/imagen-perro.jpg';
          else if (especie === 'gato') imgSrc = '../images/imagen-gato.jpg';
          else imgSrc = '../images/publicacion-ejemplo.jpg';
      }

      let emoji = '🐾';
      if (pub.especie && pub.especie.toLowerCase() === 'perro') emoji = '🐶';
      else if (pub.especie && pub.especie.toLowerCase() === 'gato') emoji = '🐱';


      div.innerHTML = `
        <img src="${imgSrc}" class="img" onerror="this.onerror=null;this.src='../images/publicacion-ejemplo.jpg';">
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
            acciones.innerHTML = `<p>Tu solicitud está pendiente</p>`;
          }

          if (solicitud.estado === "aceptada") {
            acciones.innerHTML = `<p>¡Fuiste aceptado!</p>`;
          }

          if (solicitud.estado === "rechazada") {
            acciones.innerHTML = `<p>Tu solicitud fue rechazada</p>`;
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
        boton.className = "boton-adoptar";
        boton.addEventListener("click", async () => {
            const mensaje = prompt("Escribe un mensaje al dueño (opcional):");
            if (mensaje === null) {return;}
            await crearSolicitud(pub.publicacion_adopciones_id, mensaje);
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
      const img = especie === 'perro' ? '../images/imagen-perro.jpg' : especie === 'gato' ? '../images/imagen-gato.jpg' : '../images/publicacion-ejemplo.jpg';

      const URL_IMAGENES = "http://localhost:3000/uploads/";
      let imgSrcModal = img;
      if (pub.imagen_mascota && pub.imagen_mascota !== "null") {
          imgSrcModal = URL_IMAGENES + pub.imagen_mascota;
      }
      document.getElementById("modalImgMascota").src = imgSrcModal;
      document.getElementById("modalNombreMascota").textContent = pub.nombre_mascota;
      document.getElementById("modalRaza").textContent = pub.raza;
      document.getElementById("modalEdad").textContent = pub.edad + " años";
      document.getElementById("modalTamano").textContent = pub.tamanio;

      document.getElementById("modalImgUsuario").src = usuario.imagen_usuario ? (URL_IMAGENES + usuario.imagen_usuario) : '../images/imagen-usuario.jpg';
      document.getElementById("modalUsuarioNombre").textContent = usuario.nombre_completo || usuario.nombre;
      document.getElementById("modalTelefono").textContent = usuario.telefono;
      document.getElementById("modalDireccion").textContent = usuario.direccion;

      const btnPerfil = document.getElementById("btnVerPerfilCompleto");
      if (btnPerfil) {
          btnPerfil.onclick = () => {
              window.location.href = `usuario.html?usuarioId=${userId}`;
          };
      }

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
    try {
      const res = await fetch("http://localhost:3000/api/publicaciones_adopciones", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        alert("Publicación creada con éxito");
        modalCrear.style.display = "none";
        formCrear.reset();

        const publicaciones = await obtenerPublicaciones();
        location.reload(); 
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Error al crear publicación");
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

const btnLogout = document.getElementById('btn-logout');
const btnLogin = document.getElementById('btn-login');

if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('usuarioId');
        alert('Sesión cerrada correctamente');
        window.location.reload();
    });
}

const usuarioLogueado = localStorage.getItem('usuarioId');
if (!usuarioLogueado && btnLogout) {
    btnLogout.style.display = 'none';
}

if (usuarioLogueado && btnLogin) {
    btnLogin.style.display = 'none';
}