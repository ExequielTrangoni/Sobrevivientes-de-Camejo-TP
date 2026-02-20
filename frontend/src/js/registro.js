const API_REGISTRO = 'https://sobrevivientes-de-camejo-tp.onrender.com/api/usuarios/registro';
const formRegistro = document.getElementById('form-registro'); 

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    const telefono = document.getElementById('telefono').value;

    const datosUsuario = {
        nombre: nombre,
        email: email,
        contrasenia: password,
        telefono: telefono,
        direccion: direccion
    };
    try {
        const respuesta = await fetch(API_REGISTRO, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datosUsuario)
        });

        if (respuesta.ok) {
            const data = await respuesta.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            localStorage.setItem('usuarioId', data.usuario.id);
            alert(`¡Bienvenido de nuevo, ${data.usuario.nombre}!`);
            window.location.href = '../index.html';
        
        } else {
            const errorData = await respuesta.json();
            alert(errorData.error); 
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Hubo un error al intentar conectar con el servidor.');
    }
});