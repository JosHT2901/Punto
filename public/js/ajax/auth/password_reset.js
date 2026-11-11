async function Guardar_Reset_Password(payload) {
    try {
        MostrarCargando("Actualizando contraseña...", false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', payload);

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || "Contraseña actualizada exitosamente.", true, false, false);
            
            setTimeout(() => {
                window.location.href = 'login.php'; // Redirigir al login o vista correspondiente
            }, 1500);
            return;
        }

        const mensajeAviso = respuesta?.mensaje || "No se pudo actualizar la contraseña.";
        MostrarAlerta(mensajeAviso, 250, true);

    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        OcultarCargando();
        const mensajeError = error?.mensaje || "Ocurrió un error en el servidor.";
        MostrarAlerta(mensajeError, 250, true);
    }
}