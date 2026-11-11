$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        // Cambiado a 'ejecutar' para alinearlo con tu estándar de backend
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
            accion: 'obtener_ajustes_smtp'
        });

        OcultarCargando();

        // Extraemos los datos de forma segura (asumiendo que tu JsonResponse devuelve la data en .data o directamente)
        const smtp = respuesta.data || respuesta || {};

        // Guardamos de forma global en caché
        window.configuracion = smtp;

        // Disparamos el evento por si otros scripts lo escuchan
        $(document).trigger('datosListos.smtp');

    } catch (error) {
        OcultarCargando();
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    }
});

async function Guardar_Configuracion_SMTP(payload) {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Guardando configuración SMTP...', false);
        }

        // Enviar mediante el servicio Ajax
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', payload);
        console.log(respuesta)
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.log(respuesta)
        // Validar respuesta exitosa del servidor
        if (respuesta && (respuesta.ok || respuesta.success)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Configuración SMTP guardada correctamente.', true, false, false);
            }
            
            // Opcional: Actualizar caché global
            window.configuracion = payload;

            // Notificar a la ventana padre mediante el messenger de iframes
            setTimeout(() => {
                if (window.parent && $.messenger && typeof $.messenger.send === 'function') {
                    $.messenger.send(
                        window.parent,
                        'configuracion_smtp_actualizada',
                        { status: 'success', mensaje: 'Proceso completado'},
                        '*'
                    );
                }
                ModalAPI.cerrar()
            }, 1000);

        } else {
            // Manejo de error devuelto por la lógica del servidor
            const mensajeError = (respuesta && (respuesta.mensaje || respuesta.error)) || 'No se pudo guardar la configuración.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            } else if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError, 250, false);
            } else {
                alert(mensajeError);
            }
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al guardar SMTP:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error de red al intentar guardar la configuración.', false, false, false);
        }
    }
}