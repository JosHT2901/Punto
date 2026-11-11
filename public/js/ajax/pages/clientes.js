$.messenger.on('tipo_seleccionado', function (data, sourceWindow, origin) {
    const formato = typeof data === 'object' && data.formato ? data.formato : data;
    
    // Obtenemos la selección bruta del controlador
    const seleccionBruta = window.ClientesSelectionController ? window.ClientesSelectionController.getSeleccionados() : [];

    // Normalizamos: Aseguramos que sea un arreglo plano de IDs (por si devuelve objetos)
    const seleccion = seleccionBruta.map(item => {
        if (typeof item === 'object' && item !== null) {
            // Extrae la propiedad ID o id si es un objeto, o el primer valor disponible
            return item.ID || item.id || Object.values(item)[0];
        }
        return item;
    }).filter(id => id !== undefined && id !== null && id !== '');

    let url = '../../../src/controllers/php/controllers/clientes.php';
    let accion = 'exportar_clientes';

    console.log("IDs limpios a exportar:", seleccion); // Depuración en consola del navegador

    ExportacionService.exportar(url, accion, formato, { seleccion: seleccion });
});


$(document).ready(async function (e) {
    try {
        // Función auxiliar limpia y segura para evaluar permisos
        const verificarPermiso = (permiso) => {
            return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' ?
                PermisosService.tienePermiso(permiso) :
                true;
        };

        // Asignación de variables globales de permisos
        window.permiso_ver= verificarPermiso('ver_clientes');
        window.permiso_editar = verificarPermiso('editar_clientes');
        window.permiso_crear = verificarPermiso('crear_clientes');
        console.log(window.permiso_crear)
        window.permiso_eliminar = verificarPermiso('eliminar_clientes'); // 🌟 Typo corregido

        if (!permiso_ver) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // 3. Disparar eventos pasando los datos obtenidos por si algún script los escucha
        $(document).trigger('datosListos.clientes');

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

    } catch (error) {
        console.error("Error crítico al inicializar las localidades:", error);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar las localidades.', false, false, false);
        }
    }
});



/**
 * Obtiene los clientes paginados desde la API y actualiza el estado cifrado de la URL fusionando los parámetros previos.
 * 
 * @param {number} pagina - Número de página actual.
 * @param {number} registrosPorPagina - Cantidad de registros por página.
 * @param {Object} filtros - Objeto con los filtros aplicados (ej. { buscar: 'Juan', habilitado: 1 }).
 * @param {Object} orden - Objeto con el ordenamiento (ej. { columna: 'Nombre', direccion: 'DESC' }).
 * @returns {Promise} - Promesa con la respuesta del servidor.
 */
function Obtener_Clientes_API(pagina = 1, registrosPorPagina = 25, filtros = {}, orden = {}) {
    console.log("Filtros enviados:", filtros);
    console.log("Orden enviado:", orden);

    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        // Recuperar parámetros anteriores si existen en la URL cifrada
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') 
            ? window.UrlStateSyncService.obtenerParametros() || {} 
            : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            pagina: pagina,
            registros: registrosPorPagina,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/clientes.php', // URL del endpoint
        {
            accion: 'obtener_clientes_paginados',
            pagina: pagina,
            registros_por_p: registrosPorPagina,
            ...filtros, // Expande los filtros dinámicos del módulo
            ...orden    // Expande el ordenamiento
        },
        false // esFormData (false ya que enviamos un objeto plano)
    );
}
/**
 * Obtiene el catálogo de regímenes fiscales desde el archivo JSON de manera asíncrona.
 * @returns {Promise<Array>} Retorna el arreglo de regímenes fiscales.
 */
async function Obtener_Regimenes_API() {
    try {
        if (typeof CargarJSON === 'function') {
            const datos = await CargarJSON('../../../src/json/data/regimenes.json');
            // Aseguramos que retorne un arreglo (si viene envuelto en un objeto o data, ajústalo aquí)
            return Array.isArray(datos) ? datos : (datos?.data || datos?.resultado || []);
        }
        return [];
    } catch (error) {
        console.error("Error al cargar los regímenes fiscales:", error);
        return [];
    }
}


async function Procesar_Archivo_Importar_Clientes(archivoSeleccionado) {
    try {
        console.log(archivoSeleccionado);
        const respuesta = await FileUploadService.subir(
            '../../../src/controllers/php/controllers/clientes.php', // URL del endpoint
            archivoSeleccionado,
            'importar_clientes', // La acción que leerá tu PHP en el despachador
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
function EliminarClientesMasivos() {
    const seleccionados = window.ClientesSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos un cliente', 230, false);
    }
    
    EliminarClientes(seleccionados);
}

function ExportarClientesMasivos() {

    CrearVentanaIframe(
        'Tipo de archivo',
        '../components/tipo.archivo.php',
        '520px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                tipos_permitidos: '.pdf, .csv, .xml, .xls, .xlsx',
                multiple: false,
            };
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );  
}

function EliminarClientes(idsSeleccionados) {
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
    const mensaje = `¿Estás seguro de eliminar ${esUnico ? 'el cliente' : 'los clientes'} seleccionado${esUnico ? '' : 's'}?`;

    EliminarService.ejecutar('../../../src/controllers/php/controllers/clientes.php', 'eliminar_clientes', idsArray, {
        titulo: `¿Eliminar cliente${esUnico ? '' : 's'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 320,
        onSuccess: function(response) {
            MostrarMensaje('Clientes eliminados correctamente',true,false,false)
            setTimeout(() => {
            idsArray.forEach(id => {
                $(`.card[data-id="${id}"]`).fadeOut(300, function() {
                    $(this).remove();
                });
                CargarClientes()
                });
            })
        }
    });
}

function HabilitarClientesMasivos()
{
    const seleccionados = window.ClientesSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos un cliente', 230, false);
    }
    HabilitarClientes(seleccionados)
}

function HabilitarClientes(idsSeleccionados) {
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
    const mensaje = `¿Estás seguro de habilitar ${esUnico ? 'el cliente' : 'los clientes'} seleccionado${esUnico ? '' : 's'}?`;

    // Invocamos directamente el servicio que se encarga del flujo completo (Confirmación -> Carga -> AJAX -> Mensaje)
    HabilitarService.ejecutar('../../../src/controllers/php/controllers/clientes.php', 'habilitar_clientes', idsArray, {
        titulo: `¿Habilitar cliente${esUnico ? '' : 's'}?`,
        mensaje: mensaje,
        icono: 'vf-ic_fluent_checkmark_circle_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-success', // Corregido a verde para indicar éxito/habilitación
        altura: 320,
        onSuccess: function(response) {
            MostrarMensaje('Clientes habilitados correctamente',true,false,false)
            setTimeout(() => {
                // Animación de salida para las tarjetas en la interfaz
                idsArray.forEach(id => {
                    $(`.card[data-id="${id}"]`).fadeOut(300, function() {
                        $(this).remove();
                    });
                });

                // Refrescar el listado general y contadores
                if (typeof CargarClientes === 'function') {
                    CargarClientes();
                } 
            }, 1000);
            
           
        }
    });
}