$(document).ready(async function (e) {
    try {
        // Función auxiliar limpia y segura para evaluar permisos
        const verificarPermiso = (permiso) => {
            return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' ?
                PermisosService.tienePermiso(permiso) :
                true;
        };

        // Asignación de variables globales de permisos
        window.permiso_ver = verificarPermiso('ver_sucursales');
        window.permiso_editar = verificarPermiso('editar_sucursales');
        window.permiso_crear = verificarPermiso('crear_sucursales');
        window.permiso_eliminar = verificarPermiso('eliminar_sucursales');

        if (!permiso_ver) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // 🌟 Disparar evento de sucursales listas en lugar de localidades
        $(document).trigger('datosListos.sucursales');


    } catch (error) {
        console.error("Error crítico al inicializar las sucursales:", error);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar las sucursales.', false, false, false);
        }
    }
});

function Obtener_Sucursales_API(pagina = 1, registrosPorPagina = 25, filtros = {}, orden = {}) {
    console.log("Filtros enviados:", filtros);
    console.log("Orden enviado:", orden);

    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        // Recuperar parámetros anteriores si existen en la URL cifrada
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') ?
            window.UrlStateSyncService.obtenerParametros() || {} : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            pagina: pagina,
            registros: registrosPorPagina,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente apuntando al controlador de sucursales
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/sucursales.php', // URL del endpoint para sucursales
        {
            accion: 'obtener_sucursales_paginadas',
            pagina: pagina,
            registros_por_p: registrosPorPagina,
            ...filtros, // Expande los filtros dinámicos del módulo
            ...orden // Expande el ordenamiento
        },
        false // esFormData (false ya que enviamos un objeto plano)
    );
}

async function EliminarSucursal(id) {
    if (!id) {
        console.error("EliminarSucursal: No se proporcionó un ID válido.");
        return false;
    }

    // 1. Mostrar la pregunta de confirmación adaptada para sucursales
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar Sucursal',
        texto: `¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.`,
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 350
    });

    // 2. Si el usuario cancela, detenemos el proceso
    if (!confirmado) {
        return false;
    }

    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Eliminando sucursal...', false);
    }

    try {
        const response = await window.AjaxService.enviar(
            '../../../src/controllers/php/controllers/sucursales.php', {
                accion: 'eliminar_sucursal',
                id: id
            },
            false // esFormData = false
        );

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (response && response.ok) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(response.mensaje || 'Sucursal eliminada correctamente.', true, false, true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                if (typeof CargarSucursales === 'function') {
                    CargarSucursales();
                }
            }, 1000);

            return response;
        } else {
            // 🌟 Capturamos el mensaje exacto que envía el backend (ej. cuando intentan eliminar la sucursal actual)
            const mensajeError = (response && (response.mensaje || response.message)) ? (response.mensaje || response.message) : 'No se pudo eliminar la sucursal.';

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
        console.error("Error al eliminar la sucursal:", error);

        const mensajeCatch = (error && error.mensaje) ? error.mensaje : 'Ocurrió un error inesperado al intentar eliminar la sucursal.';

        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(mensajeCatch, 250, false);
        }
        throw error;
    }
}

async function Habilitar_Sucursal(id) {
    if (!id) {
        console.error("Habilitar_Sucursal: No se proporcionó un ID válido.");
        return false;
    }

    // 1. Mostrar la pregunta de confirmación adaptada
    const confirmado = await MostrarPregunta({
        titulo: 'Habilitar Sucursal',
        texto: `¿Estás seguro de que deseas habilitar esta sucursal? Volverá a estar activa en el sistema.`,
        icono: 'vf-ic_fluent_checkmark_circle_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 350
    });

    // 2. Si el usuario cancela, detenemos el proceso
    if (!confirmado) {
        return false;
    }

    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Habilitando sucursal...', false);
    }

    try {
        const response = await window.AjaxService.enviar(
            '../../../src/controllers/php/controllers/sucursales.php', {
                accion: 'habilitar_sucursal',
                id: id
            },
            false // esFormData = false
        );

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (response && response.ok) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(response.mensaje || 'Sucursal habilitada correctamente.', true, false, true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                if (typeof CargarSucursales === 'function') {
                    CargarSucursales();
                }
            }, 1000);

            return response;
        } else {
            const mensajeError = (response && (response.mensaje || response.message)) ? (response.mensaje || response.message) : 'No se pudo habilitar la sucursal.';

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
        console.error("Error al habilitar la sucursal:", error);

        const mensajeCatch = (error && error.mensaje) ? error.mensaje : 'Ocurrió un error inesperado al intentar habilitar la sucursal.';

        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(mensajeCatch, 250, false);
        }
        throw error;
    }
}

function Eliminar_Masivo_Sucursales() {
    const seleccionados = window.SucursalesSelectionController.getSeleccionados();

    // Normalizar la variable 'seleccionados' para asegurar que siempre sea un arreglo válido
    const idsArray = Array.isArray(seleccionados) ?
        seleccionados :
        (seleccionados !== null && seleccionados !== undefined && seleccionados !== '' ? [seleccionados] : []);

    console.log("IDs a eliminar:", idsArray);

    if (idsArray.length === 0) {
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se han seleccionado elementos para eliminar.', false, false, false);
        } else if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona al menos una sucursal', 230, false);
        }
        return;
    }

    const esUnico = idsArray.length === 1;
    const mensaje = `¿Estás seguro de eliminar ${esUnico ? 'la sucursal' : 'las sucursales'} seleccionada${esUnico ? '' : 's'}?`;

    EliminarService.ejecutar('../../../src/controllers/php/controllers/sucursales.php', 'eliminar_masivo_sucursales', idsArray, {
        titulo: `¿Eliminar sucursal${esUnico ? '' : 'es'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 320,
        onSuccess: function (response) {
            setTimeout(() => {
                ModalAPI.cerrar()
                CargarSucursales()
            }, 1000);
          

        }
    });
}

function Habilitar_Masivo_Sucursales() {
    const seleccionados = window.SucursalesSelectionController.getSeleccionados();

    // Normalizar la variable 'seleccionados' para asegurar que siempre sea un arreglo válido
    const idsArray = Array.isArray(seleccionados) ?
        seleccionados :
        (seleccionados !== null && seleccionados !== undefined && seleccionados !== '' ? [seleccionados] : []);

    console.log("IDs a habilitar:", idsArray);

    if (idsArray.length === 0) {
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se han seleccionado elementos para habilitar.', false, false, false);
        } else if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona al menos una sucursal', 230, false);
        }
        return;
    }

    const esUnico = idsArray.length === 1;
    const mensaje = `¿Estás seguro de habilitar ${esUnico ? 'la sucursal' : 'las sucursales'} seleccionada${esUnico ? '' : 's'}?`;

    HabilitarService.ejecutar('../../../src/controllers/php/controllers/sucursales.php', 'habilitar_masivo_sucursales', idsArray, {
        titulo: `¿Habilitar sucursal${esUnico ? '' : 'es'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_checkmark_circle_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary',
        altura: 320,
        onSuccess: function (response) {
            setTimeout(() => {
                ModalAPI.cerrar()
                CargarSucursales();
            }, 1000);
           
        }
    });
}