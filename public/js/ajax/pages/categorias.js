$.messenger.on('tipo_seleccionado', function (data, sourceWindow, origin) {
    const formato = typeof data === 'object' && data.formato ? data.formato : data;
    
    // Obtenemos la selección bruta del controlador de categorías
    const seleccionBruta = window.CategoriasSelectionController ? window.CategoriasSelectionController.getSeleccionados() : [];

    // Normalizamos: Aseguramos que sea un arreglo plano de IDs (por si devuelve objetos)
    const seleccion = seleccionBruta.map(item => {
        if (typeof item === 'object' && item !== null) {
            // Extrae la propiedad ID o id si es un objeto, o el primer valor disponible
            return item.ID || item.id || Object.values(item)[0];
        }
        return item;
    }).filter(id => id !== undefined && id !== null && id !== '');

    let url = '../../../src/controllers/php/controllers/categorias.php';
    let accion = 'exportar_categorias';

    console.log("IDs de categorías limpios a exportar:", seleccion); // Depuración en consola del navegador

    ExportacionService.exportar(url, accion, formato, { seleccion: seleccion });
});


$(document).off('app:inicializada').on('app:inicializada', function () {
    try {
        // Función auxiliar limpia y segura para evaluar permisos
        const verificarPermiso = (permiso) => {
            return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' ?
                PermisosService.tienePermiso(permiso) :
                true;
        };
        // Asignación de variables globales de permisos para categorías
        window.permiso_ver = verificarPermiso('ver_categorias');
        window.permiso_editar = verificarPermiso('editar_categorias');
        window.permiso_crear = verificarPermiso('crear_categorias');
        window.permiso_eliminar = verificarPermiso('eliminar_categorias');

        if (!permiso_ver) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // Disparar eventos pasando los datos obtenidos por si algún script los escucha
        $(document).trigger('datosListos.categorias');

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

    } catch (error) {
        console.error("Error crítico al inicializar las categorías:", error);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar las categorías.', false, false, false);
        }
    }
});



/**
 * Obtiene las categorías paginadas desde la API y actualiza el estado cifrado de la URL fusionando los parámetros previos.
 * 
 * @param {number} pagina Número de página actual.
 * @param {number} registrosPorPagina Cantidad de registros por página.
 * @param {Object} filtros Objeto con los filtros aplicados.
 * @param {Object} orden Objeto con el ordenamiento.
 * @returns {Promise} Promesa con la respuesta del servidor.
 */
function Obtener_Categorias_API(pagina = 1, registrosPorPagina = null, filtros = {}, orden = {}) {
    const limiteRegistros = registrosPorPagina || window.registrosPorPagina || 50;
    console.log(window.registrosPorPagina)
    console.log("Filtros enviados:", filtros);
    console.log("Orden enviado:", orden);
    console.log("Registros por página usados:", limiteRegistros);

    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') 
            ? window.UrlStateSyncService.obtenerParametros() || {} 
            : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            pagina: pagina,
            registros: limiteRegistros,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente apuntando al controlador de categorías
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/categorias.php', // URL del endpoint de categorías
        {
            accion: 'obtener_categorias_paginadas',
            pagina: pagina,
            registros_por_p: limiteRegistros,
            ...filtros, // Expande los filtros dinámicos del módulo
            ...orden    // Expande el ordenamiento
        },
        false // esFormData (false ya que enviamos un objeto plano)
    );
}

async function Deshabilitar_Categoria_AJAX(id)
{
    
    try {
        MostrarCargando('Procesando solicitud...', false);

        // Llamada AJAX al controlador PHP (ajusta la acción según tu enrutador)
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'cambiar_estado_categoria', // O la acción correspondiente en tu PHP
            id: id,
            habilitado: 0 // 0 para deshabilitar
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Categoría deshabilitada correctamente.', true, false, false);
            
            // Recargamos la vista o actualizamos la tabla según tu lógica
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            // Si el backend rechaza la acción por tener productos asociados
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar la operación.';
            MostrarMensaje(mensajeError, false, true, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al deshabilitar la categoría:", error);
        
        let mensajeServidor = 'Ocurrió un error inesperado al conectar con el servidor.';
        if (error.response && error.response.mensaje) {
            mensajeServidor = error.response.mensaje;
        } else if (error.mensaje) {
            mensajeServidor = error.mensaje;
        }

        MostrarMensaje(mensajeServidor, false, true, false);
    }
}

async function Habilitar_Categoria_AJAX(id)
{
    
    try {
        MostrarCargando('Procesando solicitud...', false);

        // Llamada AJAX al controlador PHP (ajusta la acción según tu enrutador)
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'cambiar_estado_categoria', // O la acción correspondiente en tu PHP
            id: id,
            habilitado: 1 // 0 para deshabilitar
        });

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Categoría deshabilitada correctamente.', true, false, false);
            
            // Recargamos la vista o actualizamos la tabla según tu lógica
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            // Si el backend rechaza la acción por tener productos asociados
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar la operación.';
            MostrarMensaje(mensajeError, false, true, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al deshabilitar la categoría:", error);
        
        let mensajeServidor = 'Ocurrió un error inesperado al conectar con el servidor.';
        if (error.response && error.response.mensaje) {
            mensajeServidor = error.response.mensaje;
        } else if (error.mensaje) {
            mensajeServidor = error.mensaje;
        }

        MostrarMensaje(mensajeServidor, false, true, false);
    }
}


function HabilitarCategoriasMasivos()
{
    const seleccionados = window.CategoriasSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos una categoría', 230, false);
    }
    HabilitarCategorias(seleccionados)
}

function HabilitarCategorias(idsSeleccionados) {
    // Normalizar la entrada para asegurar que siempre sea un arreglo (soporta ID único o array)
    const idsArray = Array.isArray(idsSeleccionados) 
        ? idsSeleccionados 
        : (idsSeleccionados !== null && idsSeleccionados !== undefined && idsSeleccionados !== '' ? [idsSeleccionados] : []);

    console.log("IDs a habilitar:", idsArray);

    if (idsArray.length === 0) {
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se han seleccionado elementos para habilitar.', false, false, false);
        }
        return;
    }

    const esUnico = idsArray.length === 1;
    const mensaje = `¿Estás seguro de habilitar ${esUnico ? 'la categoría' : 'las categorías'} seleccionada${esUnico ? '' : 's'}?`;

    // Invocamos directamente el servicio que se encarga del flujo completo (Confirmación -> Carga -> AJAX -> Mensaje)
    HabilitarService.ejecutar('../../../src/controllers/php/controllers/categorias.php', 'habilitar_masivo_categorias', idsArray, {
        titulo: `¿Habilitar categoria${esUnico ? '' : 's'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_checkmark_circle_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary', // Corregido a verde para indicar éxito/habilitación
        altura: 320,
        onSuccess: function(response) {
            MostrarMensaje('Categorias habilitadas correctamente',true,false,false)
            setTimeout(() => {
                // Animación de salida para las tarjetas en la interfaz
                idsArray.forEach(id => {
                    $(`.card[data-id="${id}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                });

                // Refrescar el listado general y contadores
                if (typeof CargarCategorias === 'function') {
                    CargarCategorias();
                } 
            }, 1000);
            
           
        }
    });
}

function EliminarCategoriasMasivos() {
    const seleccionados = window.CategoriasSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos una categoria', 230, false);
    }
    
    EliminarCategorias(seleccionados);
}

function EliminarCategorias(idsSeleccionados) {
    // Normalizar la entrada para asegurar que siempre sea un arreglo (soporta ID único o array)
    const idsArray = Array.isArray(idsSeleccionados) 
        ? idsSeleccionados 
        : (idsSeleccionados !== null && idsSeleccionados !== undefined && idsSeleccionados !== '' ? [idsSeleccionados] : []);

    console.log("IDs a eliminar:", idsArray);

    if (idsArray.length === 0) {
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('No se han seleccionado elementos para eliminar.', false, false, false);
        }
        return;
    }

    const esUnico = idsArray.length === 1;
    const mensaje = `¿Estás seguro de eliminar ${esUnico ? 'la categoría' : 'las categorías'} seleccionado${esUnico ? '' : 's'}?`;

    EliminarService.ejecutar('../../../src/controllers/php/controllers/categorias.php', 'deshabilitar_masivo_categorias', idsArray, {
        titulo: `¿Eliminar categoria${esUnico ? '' : 's'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary',
        altura: 320,
        onSuccess: function(response) {
            MostrarMensaje('Categorias eliminados correctamente',true,false,false)
            setTimeout(() => {
            idsArray.forEach(id => {
                $(`.card[data-id="${id}"]`).fadeOut(300, function() {
                    $(this).remove();
                });
                CargarCategorias()
                });
            })
        }
    });
}