$(document).ready(async function (e) {
    try {
        window.permiso_gestion = (window.PermisosService && typeof window.PermisosService.tienePermiso === 'function') 
        ? PermisosService.tienePermiso('gestionar_biblioteca') 
        : true;

        window.asignar_usuarios = (window.PermisosService && typeof window.PermisosService.tienePermiso === 'function') 
        ? PermisosService.tienePermiso('asignar_usuarios_biblioteca') 
        : true;
        
        if (!permiso_gestion) {
            return window.location.href = '../../../pages/errores/no-permiso.php';
        }

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }
        
        // 1. Obtener siempre los tipos de archivos
        const promesaTipos = window.AjaxService.enviar(
            '../../../src/controllers/php/controllers/biblioteca.php', 
            { accion: 'obtener_tipos_archivos' }, 
            false
        );

        // 2. Obtener la lista de usuarios SOLO si tiene el permiso requerido
        let promesaUsuarios = Promise.resolve(null);
        if (window.asignar_usuarios) {
            promesaUsuarios = window.AjaxService.enviar(
                '../../../src/controllers/php/controllers/usuarios.php', 
                { accion: 'obtener_usuarios' }, 
                false
            );
        }

        // Ejecutar peticiones en paralelo de manera inteligente
        const [tipos, respuestaUsuarios] = await Promise.all([promesaTipos, promesaUsuarios]);

        // 3. Almacenar de forma global
        window.tipos = tipos;
        window.usuarios = respuestaUsuarios || [];
        console.log(window.usuarios)
       

        // 4. Disparar eventos pasando los datos obtenidos por si algún script los escucha
        $(document).trigger('datosListos.biblioteca', [tipos, window.usuarios]);

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);
        
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    }
});



/**
 * Realiza la petición AJAX para obtener los archivos de la biblioteca.
 * @param {number} [offset=0] Desplazamiento para paginación.
 * @param {number} [limite=20] Cantidad de registros por página.
 * @param {Object} [filtros={}] Filtros aplicados (tipo_archivo, busqueda, etc.).
 * @param {Object} [orden={}] Parámetros de ordenamiento.
 * @returns {Promise<Object>} Promesa con la respuesta del servidor.
 */
function Obtener_Archivos_Biblioteca_API(offset = 0, limite = 20, filtros = {}, orden = {}) {
    console.log("Filtros de biblioteca enviados:", filtros);
    console.log("Orden enviado:", orden);
    console.log("Offset actual:", offset);

    // 1. Sincronizar y cifrar el estado actual en la URL del navegador de forma segura
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') ?
            window.UrlStateSyncService.obtenerParametros() || {} :
            {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            offset: offset,
            limite: limite,
            vista: window.vista_ventana ? 'tarjetas' : 'lista', // <-- Sincronización del tipo de vista en la URL cifrada
            ...filtros,
            ...orden
        });
    }

    // 2. Enviar la petición mediante AjaxService apuntando al controlador de biblioteca
    if (typeof AjaxService === 'undefined' || typeof AjaxService.enviar !== 'function') {
        console.error("AjaxService no está disponible.");
        return Promise.reject(new Error("AjaxService no está disponible."));
    }

    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/biblioteca.php', // Endpoint correcto de biblioteca
        {
            accion: 'obtener_archivos_biblioteca',
            offset: offset,
            limite: limite,
            ...filtros, // Expande los filtros dinámicos (tipo de archivo, búsqueda, etc.)
            ...orden // Expande el ordenamiento
        },
        false // esFormData = false ya que enviamos un objeto plano
    );
}

/**
 * Envía una petición AJAX para registrar o actualizar la última vez que se abrió un documento.
 * @param {Object|number|string} documento - Objeto archivo completo o el ID del documento.
 * @returns {Promise<Object>} Promesa con la respuesta del servidor.
 */
function Actulizar_Apertura_Documento(documento) {
    console.log(documento)
    const archivoId = (typeof documento === 'object' && documento !== null) 
        ? (documento.id || documento.ID) 
        : documento;

    if (!archivoId) {
        console.warn("Actulizar_Apertura_Documento: No se proporcionó un ID de documento válido.");
        return Promise.reject(new Error("ID de documento inválido."));
    }

    if (typeof AjaxService === 'undefined' || typeof AjaxService.enviar !== 'function') {
        console.error("AjaxService no está disponible.");
        return Promise.reject(new Error("AjaxService no está disponible."));
    }

    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/biblioteca.php',
        {
            accion: 'actualizar_apertura_documento',
            archivo_id: archivoId
        },
        false // esFormData = false ya que enviamos un objeto plano
    );
}

/**
 * Muestra un diálogo de confirmación, envía la petición AJAX para eliminar el archivo 
 * y muestra alertas o éxitos automáticamente según el resultado.
 * @param {Object|number|string} documento - Objeto archivo completo o el ID del documento.
 * @returns {Promise<Object|boolean>} Promesa con la respuesta del servidor o false si cancela.
 */
async function Eliminar_Archivo(documento) {
    const archivoId = (typeof documento === 'object' && documento !== null) 
        ? (documento.id || documento.ID) 
        : documento;

    const nombreArchivo = (typeof documento === 'object' && documento !== null) 
        ? (documento.nombre_original || documento.name || 'este archivo') 
        : 'este archivo';

    if (!archivoId) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta("No se proporcionó un ID de documento válido.",250,false);
        }
        return Promise.reject(new Error("ID de documento inválido."));
    }

    // 1. Mostrar la pregunta de confirmación
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar Archivo',
        texto: `¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.`,
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

    MostrarCargando('Eliminando archivo...',false)
    try {
        const response = await AjaxService.enviar(
            '../../../src/controllers/php/controllers/biblioteca.php',
            {
                accion: 'eliminar_archivo',
                archivo_id: archivoId
            },
            false // esFormData = false
        );
        OcultarCargando()
        if (response && response.ok) {
            if (typeof MostrarExito === 'function') {
                MostrarMensaje('Archivo eliminado correctamente.',true,false,true);
            }
            setTimeout(() => {
                ModalAPI.cerrar()
                CargarArchivosBiblioteca(true)
            }, 1000);
           
        } else {
            const mensajeError = (response && response.message) ? response.message : 'No se pudo eliminar el archivo.';
            if (typeof MostrarAlerta === 'function') {
                OcultarCargando()
                MostrarAlerta(mensajeError,250,false);
            }
        }

        return response;

    } catch (error) {
        console.error("Error al eliminar el archivo:", error);
        OcultarCargando()
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ocurrió un error inesperado al intentar eliminar el archivo.',250,false);
        }
        throw error;
    }
}

/**
 * Envía una petición AJAX para duplicar (crear copia) un archivo de la biblioteca
 * y muestra alertas o éxitos automáticamente según el resultado.
 * @param {Object|number|string} documento - Objeto archivo completo o el ID del documento.
 */
function Duplicar_Archivo_Biblioteca(documento) {
    MostrarCargando('Copiando archivo...',false)
    const archivoId = (typeof documento === 'object' && documento !== null) 
        ? (documento.id || documento.ID) 
        : documento;

    if (!archivoId) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta("No se proporcionó un ID de documento válido para duplicar.", 250, false);
        }
        return;
    }

    AjaxService.enviar(
        '../../../src/controllers/php/controllers/biblioteca.php',
        {
            accion: 'crear_copia_archivo',
            archivo_id: archivoId
        },
        false // esFormData = false ya que enviamos un objeto plano
    )
    .then(response => {
        OcultarCargando()
        if (response && response.ok) {
            if (typeof MostrarExito === 'function') {
                MostrarMensaje('Copia del archivo creada exitosamente.',true,false,true);
            }
            setTimeout(() => {
                ModalAPI.cerrar()
                CargarArchivosBiblioteca(true)
            }, 1000);
        } else {
            const mensajeError = (response && response.message) ? response.message : 'No se pudo duplicar el archivo.';
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError,250,false);
            }
        }
    })
    .catch(error => {
        console.error("Error al duplicar el archivo:", error);
        OcultarCargando()
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ocurrió un error inesperado al intentar duplicar el archivo.', 250, false);
        }
    });
}

async function Eliminar_Archivos_Multiples() {
    const seleccionados = window.SeleccionSinChecksController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos un archivo', 230, false);
    }

    // 1. Mostrar la pregunta de confirmación
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar Archivos',
        texto: `¿Estás seguro de que deseas eliminar estos archivos? Esta acción no se puede deshacer.`,
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

    MostrarCargando('Eliminando archivos...', false);

    try {
        const response = await AjaxService.enviar(
            '../../../src/controllers/php/controllers/biblioteca.php',
            {
                accion: 'eliminar_archivos_multiples',
                archivo_ids: seleccionados
            },
            false // esFormData = false
        );

        OcultarCargando();

        if (response && response.ok) {
                MostrarMensaje('Archivos eliminados correctamente.', true, false, true);

            // Limpiar selección visual y lógica
            if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.limpiar === 'function') {
                window.SeleccionSinChecksController.limpiar();
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                if (typeof CargarArchivosBiblioteca === 'function') {
                    CargarArchivosBiblioteca(true);
                }
            }, 1000);

        } else {
            const mensajeError = (response && (response.message || response.mensaje)) ? (response.message || response.mensaje) : 'No se pudieron eliminar los archivos.';
                MostrarAlerta(mensajeError, 250, false);
        }

        return response;

    } catch (error) {
        console.error("Error al eliminar los archivos:", error);
        OcultarCargando();
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ocurrió un error inesperado al intentar eliminar los archivos.', 250, false);
        }
        throw error;
    }
}

async function Descargar_Archivos_Seleccionados() {
    const seleccionados = window.SeleccionSinChecksController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona al menos un archivo para descargar', 230, false);
        }
        return;
    }

    try {
        // 1. Mostramos indicador de carga
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Preparando descarga...', false);
        }

        // 2. Definimos si es un archivo individual o un ZIP masivo
        const esZip = seleccionados.length > 1;
        const accion = esZip ? 'descargar_archivos_zip' : 'descargar_archivo_individual';
        const payload = esZip ? { archivo_ids: seleccionados } : { archivo_id: seleccionados[0] };
        const nombrePorDefecto = esZip ? `archivos_biblioteca_${new Date().toISOString().slice(0, 10)}.zip` : 'archivo_biblioteca';

        // 3. Esperamos la promesa de la descarga con ejecutarClick: false para obtener el blob
        const respuesta = await window.AjaxService.descargarArchivo(
            '../../../src/controllers/php/controllers/biblioteca.php', 
            {
                accion: accion,
                ...payload
            },
            false,
            nombrePorDefecto,
            false // ejecutarClick = false para retornar el blob y el nombre
        );

        // 4. Ocultamos el indicador de carga
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        console.log("Respuesta de descarga:", respuesta);

        // Como pasamos ejecutarClick: false, la promesa devuelve { ok: true, blob: ..., nombre: ... }
        if (respuesta && respuesta.ok) {
            // 5. Mostramos la pregunta de confirmación
            const confirma = await MostrarPregunta({
                titulo: esZip ? 'Descargar Archivos ZIP' : 'Descargar Archivo',
                texto: esZip 
                    ? `Se han comprimido ${seleccionados.length} archivos. ¿Deseas descargarlos?` 
                    : 'Archivo listo para descargar. ¿Deseas continuar?',
                icono: 'fa-solid fa-download text-gray-500',
                confirmarText: 'Descargar',
                colorConfirmar: 'btn-primary',
                altura: 350
            });

            // 6. Si el usuario confirma, ejecutamos el disparo manual de la descarga con el blob recibido
            if (confirma) {
                const urlBlob = window.URL.createObjectURL(respuesta.blob);
                const link = document.createElement("a");
                link.href = urlBlob;
                link.download = respuesta.nombre; // Toma el nombre del Content-Disposition o el predeterminado
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    window.URL.revokeObjectURL(urlBlob);
                    document.body.removeChild(link);
                }, 200);

                // Limpiar la selección tras iniciar la descarga exitosamente
                if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.limpiar === 'function') {
                    window.SeleccionSinChecksController.limpiar();
                }
            }
        }
    } catch (error) {
        // Manejo de errores (captura el reject de tu XMLHttpRequest si falla o retorna JSON de error)
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error en la descarga:", error);

        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(error.mensaje || 'Ocurrió un error inesperado al intentar descargar el archivo.', 230, false);
        }
    }
}

async function Cambiar_Nombre_Archivo_Ajax(archivo, nuevoNombre) {
    // Extraer de forma segura el ID, ya sea que 'archivo' sea el ID directo o un objeto/elemento
    const archivoId = (typeof archivo === 'object' && archivo !== null) 
        ? (archivo.id || archivo.archivo_id || archivo.dataset?.id || 0) 
        : archivo;

    if (!archivoId || archivoId <= 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Identificador de archivo no válido', 250, false);
        }
        return;
    }

    MostrarCargando('Actualizando nombre...', false);
    
    window.AjaxService.enviar('../../../src/controllers/php/controllers/biblioteca.php', {
        accion: 'cambiar_nombre_archivo',
        archivo_id: archivoId,
        nuevo_nombre: nuevoNombre
    })
    .then(respuesta => {
        OcultarCargando();
        if (respuesta && respuesta.ok) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Nombre actualizado correctamente.', true, false, true);
            }
            
            // Recargar la biblioteca para reflejar el cambio visualmente
            if (typeof CargarArchivosBiblioteca === 'function') {
                CargarArchivosBiblioteca(true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);
        } else {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al actualizar el nombre', 250);
            }
        }
    })
    .catch(error => {
        console.error("Error crítico al cambiar el nombre del archivo:", error);
        OcultarCargando();
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Error de conexión al intentar actualizar el nombre', 250);
        }
    });
}

async function Asignar_Archivo_Usuarios_Ajax(archivo, usuariosIds) {
  console.log(usuariosIds)
    const archivoId = (typeof archivo === 'object' && archivo !== null) 
        ? (archivo.id || archivo.archivo_id || archivo.dataset?.id || 0) 
        : archivo;

    if (!archivoId || archivoId <= 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Identificador de archivo no válido', 250, false);
        }
        return;
    }

    if (!Array.isArray(usuariosIds)) {
        usuariosIds = [];
    }

    MostrarCargando('Guardando asignaciones...', false);
    
    window.AjaxService.enviar('../../../src/controllers/php/controllers/biblioteca.php', {
        accion: 'asignar_usuarios_archivo',
        archivo_id: archivoId,
        usuarios_ids: usuariosIds
    })
    .then(respuesta => {
        OcultarCargando();
        if (respuesta && respuesta.ok) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Asignaciones guardadas correctamente.', true, false, true);
            }
            
            // Actualizar la caché global localmente de inmediato
            window.usuariosAsignadosBiblioteca = window.usuariosAsignadosBiblioteca || {};
            window.usuariosAsignadosBiblioteca[archivoId] = usuariosIds.map(Number);

            // Recargar la biblioteca para reflejar el estado actual
            if (typeof CargarArchivosBiblioteca === 'function') {
                CargarArchivosBiblioteca(true);
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);
        } else {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Ocurrió un error al guardar las asignaciones', 250);
            }
        }
    })
    .catch(error => {
        console.error("Error crítico al asignar usuarios al archivo:", error);
        OcultarCargando();
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Error de conexión al intentar guardar las asignaciones', 250);
        }
    });
}