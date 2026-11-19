$(document).ready(async function () {
    await Cargar_Imagen();
});

async function Cargar_Imagen() {
    window.imagenBase64 = null;
    
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Obteniendo información...', false);
    }

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
            accion: 'obtener_imagen_usuario'
        });
        console.log(respuesta)
        // Soporte tanto para .ok como para .success, y flexibilidad en el nombre de la clave
        const esExitoso = (respuesta && respuesta.ok);
        
        if (esExitoso && respuesta.data) {
            window.imagenBase64 = respuesta.data.imagen_base64;
        }
        $(document).trigger('datosListos.gestionImagen');
    } catch (err) {
        console.error("Error al obtener la imagen:", err);
        OcultarCargando();
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error al obtener la información', false, false, false);
        }
    } 
    
}

async function Guardar_Imagen_Perfil(datosImagen) {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Guardando imagen de perfil...', false);
    }

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', datosImagen);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        const esExitoso = (respuesta && (respuesta.ok || respuesta.success === true));

        if (esExitoso) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Imagen de perfil guardada y actualizada correctamente', true, false, true);
            }

            // Actualizamos la variable global con la nueva imagen guardada
            if (datosImagen.imagen) {
                window.imagenBase64 = datosImagen.imagen;
            }

            // Mostramos el botón de eliminar si estaba oculto (#btn-eliminar-imagen o su contenedor)
            $('#btn-eliminar-imagen').removeClass('d-none');

            setTimeout(() => {
                if (typeof ModalAPI === 'object' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                    $.messenger.send(
                        window.parent,
                        'imagen_actualizada',
                        { status: 'success', mensaje: 'Proceso completado',data:datosImagen.imagen},
                        '*'
                    );
                }
            }, 1000);
        } else {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al guardar la imagen de perfil', 250);
            }
        }
    } catch (error) {
        console.error("Error crítico al guardar la imagen de perfil:", error);
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(error.mensaje || 'Error de conexión al intentar guardar la imagen de perfil', 250);
        }
    }
}

async function Ejecutar_Eliminacion_Imagen_Perfil() {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Eliminando imagen de perfil...', false);
    }

    const datosEliminacion = {
        accion: 'eliminar_imagen_usuario' // Acción correcta para el controlador de usuarios
    };

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', datosEliminacion);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        const esExitoso = (respuesta && (respuesta.ok || respuesta.success === true));

        if (esExitoso) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Imagen de perfil eliminada correctamente', true, false, true);
            }

            window.imagenBase64 = null;
            window.miRecortadorActual = null;

            // Destruimos la instancia activa de Croppie
            const $contenedor = $('#contenedor-croppie');
            RecortadorUI.destruir($contenedor);

            // Ocultamos el botón de eliminar
            $('#btn-eliminar-imagen, #contenedor-boton-eliminar').addClass('d-none');
            // Ocultamos el botón de guardar si estuviera visible
            $('#btn-guardar-imagen, #boton-guardar-imagen').addClass('d-none');

            // Volvemos a renderizar el panel inicial limpio para perfil
            Renderizar_Panel_Inicial_Perfil($contenedor);

            setTimeout(() => {
                if (typeof ModalAPI === 'object' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                    $.messenger.send(
                        window.parent,
                        'imagen_actualizada',
                        { status: 'success', mensaje: 'Proceso completado',data:window.imagen_base64},
                        '*'
                    );
                }
            }, 1000);

        } else {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al eliminar la imagen de perfil', 250);
            }
        }
    } catch (error) {
        console.error("Error crítico al eliminar la imagen de perfil:", error);
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(error.mensaje || 'Error de conexión al intentar eliminar la imagen de perfil', 250);
        }
    }
}