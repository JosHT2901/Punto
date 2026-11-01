$(document).ready(async function () {
    await Cargar_Logotipo();
});

async function Cargar_Logotipo() {
    window.logoBase64 = null;
    MostrarCargando('Obteniendo información...', false);

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
            accion: 'obtener_logo_empresa'
        });

        if (respuesta && respuesta.ok && respuesta.data && respuesta.data.logo_base64) {
            window.logoBase64 = respuesta.data.logo_base64;
        }
    } catch (err) {
        console.error("Error al obtener el logotipo de la empresa:", err);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error al obtener la información', false, false, false);
        }
    } finally {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
    }

    // Disparamos el evento pasando la variable global corregida
    $(document).trigger('datosListos.gestionLogotipo', [window.logoBase64]);
}

async function Guardar_Logo_Empresa(datosLogo) {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Guardando logotipo...', false);
    }

    window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', datosLogo)
        .then(respuesta => {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            if (respuesta && respuesta.ok) {
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje(respuesta.mensaje || 'Logotipo guardado y actualizado correctamente', true, false, true);
                }

                // Actualizamos la variable global con el nuevo logo guardado
                if (datosLogo.logo) {
                    window.logoBase64 = datosLogo.logo;
                }

                // Mostramos el botón de eliminar si estaba oculto
                $('#contenedor-boton-eliminar').removeClass('d-none');

                setTimeout(() => {
                    if (typeof ModalAPI === 'object' && typeof ModalAPI.cerrar === 'function') {
                        ModalAPI.cerrar();
                    }
                }, 1000);
            } else {
                if (typeof MostrarAlerta === 'function') {
                    MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al guardar el logotipo', 250);
                }
            }
        })
        .catch(error => {
            console.error("Error crítico al guardar el logotipo:", error);
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(error.mensaje || 'Error de conexión al intentar guardar el logotipo', 250);
            }
        });
}

function Ejecutar_Eliminacion_Logo() {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Eliminando logotipo...', false);
    }

    const datosEliminacion = {
        accion: 'eliminar_logo_empresa'
    };

    window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', datosEliminacion)
        .then(respuesta => {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            if (respuesta && respuesta.ok) {
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje('Logotipo eliminado correctamente', true, false, true);
                }

                window.logoBase64 = null;
                window.miRecortadorActual = null;

                // Destruimos la instancia activa de Croppie
                const $contenedor = $('#contenedor-croppie');
                RecortadorUI.destruir($contenedor);

                // Ocultamos el botón de eliminar
                $('#contenedor-boton-eliminar').addClass('d-none');

                // Volvemos a renderizar el panel inicial limpio
                Renderizar_Panel_Inicial_Logo($contenedor);

                setTimeout(() => {
                    if (typeof ModalAPI === 'object' && typeof ModalAPI.cerrar === 'function') {
                        ModalAPI.cerrar();
                    }
                }, 1000);

            } else {
                if (typeof MostrarAlerta === 'function') {
                    MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al eliminar el logotipo', 250);
                }
            }
        })
        .catch(error => {
            console.error("Error crítico al eliminar el logotipo:", error);
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(error.mensaje || 'Error de conexión al intentar eliminar el logotipo', 250);
            }
        });
}