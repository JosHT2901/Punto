$.messenger.off('password_actualizado').on('password_actualizado', function (data, sourceWindow, origin) {
    if (data.status = 'success') {
        window.location.reload()
        ModalAPI.cerrar()
    }
});
$.messenger.off('pin_actualizado').on('pin_actualizado', function (data, sourceWindow, origin) {
    if (data.status = 'success') {
        window.location.reload()
        ModalAPI.cerrar()
    }
});
$.messenger.off('usuario_actualizado').on('usuario_actualizado', function (data, sourceWindow, origin) {
    if (data.status === 'success') {
        // Validamos si se cambió el correo electrónico
        if (data.correo_cambiado === true) {
            // 💡 Redirigir a la vista/flujo de verificación de correo
            window.location.href = 'verificar.correo.php'; // Ajusta la ruta según tu proyecto
        } else {
            // 💡 Si no cambió, comportamiento normal: recargar y cerrar modal
            window.location.reload();
            ModalAPI.cerrar();
        }
    }
});
$.messenger.off('imagen_actualizada').on('imagen_actualizada', function (data, sourceWindow, origin) {
    console.log(data);
    
    // Verificamos si la respuesta fue exitosa
    if (data.status === 'success' ) {
        // Extraemos el Base64 de la estructura de la respuesta (según cómo viaje en el objeto)
        const imagenBase64 = data.data;

        if (imagenBase64) {
            // Inyectamos la imagen en Base64 en todas las clases .imagen_usuario
            $(".imagen_usuario").attr('src', imagenBase64).removeClass('h-25 w-25').addClass('h-p-100 w-p-100');
        }
        ModalAPI.cerrar()
    }
});
$(document).ready(function (e) {

    $("#boton-cambiar-password").click(function (e) {
        AbrirModalAutenticacion(false, async function (datosAuth) {
            CrearVentanaIframe(
                'Cambiar contraseña',
                '../auth/password.reset.usuario.php',
                '620px',
                true,
                true
            );
        })
    })
    $("#boton-cambiar-pin").click(function (e) {
        AbrirModalAutenticacion(false, async function (datosAuth) {
            CrearVentanaIframe(
                'Cambiar contraseña',
                '../auth/pin.reset.usuario.php',
                '620px',
                true,
                true
            );
        })
    })
    $("#btn-cambiar-imagen").click(function (e) {
        CrearVentanaIframe(
            'Editar imagen de perfil',
            '../components/imagen.usuario.actual.php',
            '600px',
            true,
            true
        );
    })
    $("#btn-editar-info-personal").click(function (e) {
        CrearVentanaIframe(
            'Editar informacion personal',
            '../components/editar.usuario.actual.php',
            '600px',
            true,
            true,
            function (iframeElement) {
                let datos = {
                    seccion:'personal',
                };

                $.messenger.send(iframeElement, 'datos_iniciales', datos);
            }
        );
    })
    $("#btn-editar-contacto").click(function (e) {
        CrearVentanaIframe(
            'Editar contacto',
            '../components/editar.usuario.actual.php',
            '600px',
            true,
            true,
            function (iframeElement) {
                let datos = {
                    seccion:'contacto',
                };

                $.messenger.send(iframeElement, 'datos_iniciales', datos);
            }
        );
    })
    $("#btn-cerrar-otras-sesiones").click(async function(e) {
        e.preventDefault();
    
        const confirma = await MostrarPregunta({
            titulo: 'Cerrar sesiones',
            icono: 'vf-ic_fluent_key_24_filled',
            texto: '¿Deseas cerrar las otras sesiones?',
            confirmarText: 'Cerrar',
            colorConfirmar: 'btn-primary',
            altura: 320
        });
    
        // 💡 Si el usuario cancela, detenemos la ejecución inmediatamente
        if (!confirma) {
            return;
        }
    
        try {
            MostrarCargando('Cerrando sesiones...', false);
    
            const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
                accion: 'cerrar_sesion_usuario',
                tipo: 'todas'
            });
    
            OcultarCargando();
            console.log("Respuesta del servidor:", respuesta);
    
            // Soporte tanto para .ok como para .success de JsonResponse
            const esExitoso = (respuesta && (respuesta.ok || respuesta.success === true));
    
            if (esExitoso) {
                MostrarMensaje('Sesiones cerradas correctamente', true, false, false);
                setTimeout(() => {
                    ModalAPI.cerrar()
                }, 1000);
            } else {
                const mensajeError = respuesta.message || (respuesta.error ? respuesta.error.message : null) || 'No se pudieron cerrar las sesiones';
                MostrarAlerta(mensajeError, 250, false);
            }
    
        } catch (error) {
            OcultarCargando();
            console.error("Error crítico al cerrar las sesiones:", error);
    
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('Ocurrió un error de conexión al procesar la solicitud.', 250, false);
            }
        }
    });
})