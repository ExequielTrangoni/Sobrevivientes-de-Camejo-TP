const API_LOGIN = 'http://localhost:3000/api/usuarios/login';
const formLogin = document.getElementById('form-login');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const datosUsuario = {
        email: email,
        contrasenia: password 
    };
    try {
        const respuesta = await fetch(API_LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datosUsuario)
        });

        if (respuesta.ok) {
            const usuario = await respuesta.json();

            localStorage.setItem('usuarioId', usuario.id);

            alert(`¡Bienvenido de nuevo, ${usuario.nombre}!`);
            window.location.href = './index.html';
        } else {
            const errorData = await respuesta.json();
            alert(errorData.error || 'Email o contraseña incorrectos');
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Hubo un error al intentar conectar con el servidor.');
    }
});