async function Cerrar_Sesion() {
    try {
        MostrarCargando('Cerrando sesión...', false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'cerrar_sesion_usuario',
            tipo: 'actual'
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            MostrarMensaje('Sesión cerrada correctamente', true, false, false);
            setTimeout(() => {
                window.location.href ='login.php';
            }, 1000);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error crítico al cerrar la sesión:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cerrar la sesión.', false, false, false);
        }
    }
}