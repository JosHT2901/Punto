async function Obtener_Permisos_Ajax(usuarioId) {
    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/permisos.php', {
            accion: 'obtener_permisos_usuario',
            usuario_id:window.usuarioId
        });

        // Validar respuesta exitosa usando tu objeto estandarizado JsonResponse
        if (!respuesta || !respuesta.ok) {
            console.error("Error al obtener permisos:", respuesta ?.mensaje);
            return null;
        }
        // Retorna el objeto 'data' con los módulos y contadores listos para renderizar
        return respuesta.data;

    } catch (error) {
        console.error("Error crítico en Obtener_Permisos:", error);
        return null;
    }
}

async function Guardar_Actualizacion_Permisos(payload) {
    const datosPermisos = {
        accion: 'actualizar_permisos_usuario',
        payload: payload
    };

    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Actualizando permisos...', false);
        }

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', datosPermisos);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // Verificamos tanto 'success' como 'ok' por compatibilidad con JsonResponse
        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Permisos actualizados correctamente.', true, false, false);
            }

            // Cerramos el modal o interfaz activa únicamente si la operación fue exitosa
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta?.mensaje || 'Error al actualizar los permisos.', false, false, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al guardar permisos:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado en la red.', false, false, false);
        }
    }
}

