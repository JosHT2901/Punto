$(document).off('app:inicializada.impuestos')
  .on('app:inicializada.impuestos', async (event) => {
    try {
        
        const verificarPermiso = (permiso) => {
            return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' ?
                PermisosService.tienePermiso(permiso) :
                true;
        };

        // Asignación de variables globales de permisos para esquemas de impuestos
        window.permiso_ver = verificarPermiso('ver_esquemas_fiscales');
        window.permiso_editar = verificarPermiso('editar_esquemas_fiscales');
        window.permiso_crear = verificarPermiso('crear_esquemas_fiscales');
        window.permiso_eliminar = verificarPermiso('eliminar_esquemas_fiscales');

        if (!permiso_ver) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }
       
        // Disparar eventos pasando los datos obtenidos por si algún script los escucha
        $(document).trigger('datosListos.impuestos');

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

    } catch (error) {
        console.error("Error crítico al inicializar los esquemas de impuestos:", error);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar los esquemas de impuestos.', false, false, false);
        }
    }
});

/**
 * Obtiene los esquemas de impuestos paginados desde la API y actualiza el estado cifrado de la URL fusionando los parámetros previos.
 * 
 * @param {number} pagina Número de página actual.
 * @param {number} registrosPorPagina Cantidad de registros por página.
 * @param {Object} filtros Objeto con los filtros aplicados.
 * @param {Object} orden Objeto con el ordenamiento.
 * @returns {Promise} - Promesa con la respuesta del servidor.
 */
function Obtener_Impuestos_API(pagina = 1, registrosPorPagina = 25, filtros = {}, orden = {}) {
    console.log("Filtros enviados:", filtros);
    console.log("Orden enviado:", orden);

    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') 
            ? window.UrlStateSyncService.obtenerParametros() || {} 
            : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios,
            pagina: pagina,
            registros: registrosPorPagina,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente apuntando al controlador correcto
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/impuestos.php', 
        {
            accion: 'obtener_esquemas_impuestos_paginados',
            pagina: pagina,
            registros_por_p: registrosPorPagina,
            ...filtros,
            ...orden
        },
        false
    );
}

async function Eliminar_Esquema_Impuestos_AJAX(id_impuesto) {
    try {
        // Ejecutar la petición AJAX al controlador de impuestos
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/impuestos.php', {
            accion: 'eliminar_esquema_fiscal',
            id: id_impuesto
        });

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        const esExitoso = respuesta && respuesta.ok === true

        if (esExitoso) {
            const mensajeExito = respuesta.mensaje || respuesta.message || 'Esquema fiscal eliminado correctamente.';
            
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeExito, true, false, true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                if (typeof CargarImpuestos === 'function') {
                    CargarImpuestos();
                }
            }, 1000);

            return respuesta;
        } else {
            const mensajeError =  respuesta.mensaje || 'No se pudo eliminar el esquema fiscal.';
            MostrarAlerta(mensajeError, 250, false);
           
            return false;
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al eliminar el esquema fiscal:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje(error.mensaje || 'Ocurrió un error al intentar eliminar el esquema fiscal.', false, true, false);
        }
        return false;
    }
}

async function Habilitar_Esquema_Impuestos_AJAX(id_impuesto) {
    try {
        // Ejecutar la petición AJAX al controlador de impuestos con la acción de habilitar
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/impuestos.php', {
            accion: 'habilitar_esquema_fiscal',
            id: id_impuesto
        });

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        const esExitoso = respuesta && (respuesta.ok === true || respuesta.success === true || (respuesta.estado && respuesta.estado === 'exito'));

        if (esExitoso) {
            const mensajeExito = respuesta.mensaje || respuesta.message || 'Esquema fiscal habilitado correctamente.';
            
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeExito, true, false, true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                if (typeof CargarImpuestos === 'function') {
                    CargarImpuestos();
                }
            }, 1000);

            return respuesta;
        } else {
            const mensajeError = (respuesta && (respuesta.mensaje || respuesta.message)) ? (respuesta.mensaje || respuesta.message) : 'No se pudo habilitar el esquema fiscal.';
            
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError, 250, false);
            } else if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, true, false);
            }
           
            return false;
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al habilitar el esquema fiscal:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje(error.message || error.mensaje || 'Ocurrió un error al intentar habilitar el esquema fiscal.', false, true, false);
        }
        return false;
    }
}

function Eliminar_Esquema_Impuestos_Masivo_AJAX(idsSeleccionados) {
    EliminarService.ejecutar('../../../src/controllers/php/controllers/impuestos.php', 'eliminar_esquemas_fiscales', idsSeleccionados, {
        titulo: 'Eliminar perfil de impuestos',
        onSuccess: function(response) {
            setTimeout(() => {
                let idsArray = Array.isArray(idsSeleccionados) ? idsSeleccionados : (typeof idsSeleccionados === 'string' ? idsSeleccionados.split(',') : [idsSeleccionados]);
                idsArray.forEach(id => {
                    $(`.card[data-id="${id}"], tr[data-id="${id}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                });

                if (typeof CargarImpuestos === 'function') {
                    CargarImpuestos();
                }
            }, 1000);
        }
    });
}

function Habilitar_Esquema_Impuestos_Masivo_AJAX(idsSeleccionados) {
    HabilitarService.ejecutar('../../../src/controllers/php/controllers/impuestos.php', 'habilitar_esquemas_fiscales', idsSeleccionados, {
        titulo: 'Habilitar perfil de impuestos',
        onSuccess: function(response) {
            setTimeout(() => {
                let idsArray = Array.isArray(idsSeleccionados) ? idsSeleccionados : (typeof idsSeleccionados === 'string' ? idsSeleccionados.split(',') : [idsSeleccionados]);
                idsArray.forEach(id => {
                    $(`.card[data-id="${id}"], tr[data-id="${id}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                });

                if (typeof CargarImpuestos === 'function') {
                    CargarImpuestos();
                }
            }, 1000);
        }
    });
}

async function Procesar_Archivo_Importar_Impuestos(archivoSeleccionado)
{
    try {
        console.log(archivoSeleccionado);
        const respuesta = await FileUploadService.subir(
            '../../../src/controllers/php/controllers/impuestos.php', // URL del endpoint
            archivoSeleccionado,
            'importar_impuestos', // La acción que leerá tu PHP en el despachador
            {},                  // Parámetros extra (objeto vacío si no requieres extras)
            'procesando archivo...' // Texto personalizado para el modal de carga en minúsculas
        );

        OcultarCargando()
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, false);
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                    CrearVentanaIframe(
                        'información del proceso',
                        '../components/informacion.php',
                        '620px',
                        true,
                        true,
                        function (iframeElement) {
                            $.messenger.send(iframeElement, 'informacion', respuesta);
                        }
                    );  
               
            }, 1000);
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'no se pudo procesar la importación del archivo.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        console.error("fallo en la subida:", error);
        MostrarAlerta(error.mensaje || 'error al procesar el archivo', 250, true);
    }
}