$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);
        
        // Ejecutamos ambas peticiones en paralelo mediante Promise.all
        const [respuestaAtributos, respuestaCategorias] = await Promise.all([ 
            CargarJSON('../../../src/json/data/atributos.json'),
            ajaxConParametros('../../../src/controllers/php/controllers/categorias.php', {
                accion: 'obtener_categorias'
            })
        ]);
        
        OcultarCargando();

        // 1. Procesamos y guardamos el catálogo de atributos en window.atributos
        if (respuestaAtributos) {
            // Si el JSON viene estructurado con catalogo_tipos_datos o es plano
            window.atributos = respuestaAtributos.catalogo_tipos_datos || respuestaAtributos;
        } else {
            window.atributos = [];
        }

        // 2. Procesamos y guardamos las categorías en window.categorias
        if (respuestaCategorias && respuestaCategorias.ok) {
            // Ajusta según cómo devuelva tu controlador los datos (ej: respuestaCategorias.data o directo el array)
            window.categorias = respuestaCategorias.data || respuestaCategorias.categorias || [];
        } else if (Array.isArray(respuestaCategorias)) {
            window.categorias = respuestaCategorias;
        } else {
            window.categorias = [];
        }

        console.log("Datos cargados correctamente:", {
            atributos: window.atributos,
            categorias: window.categorias
        });

        // 3. Disparamos el evento para inicializar la interfaz
        $(document).trigger('datosListos');

    } catch (error) {
        OcultarCargando();
        console.error("Error al obtener la información inicial:", error);

        // Mensaje de error general para fallos de red o excepciones
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
});

async function Guardar_Gestion_Categorias(datosGuardar) {
    try {
        MostrarCargando('Procesando información...', false); 

        // Ajusta la ruta del controlador de PHP según tu estructura de carpetas
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'gestionar_categorias',
            data: datosGuardar
        });
        
        console.log("Respuesta del servidor:", respuesta);

        // Validamos si la respuesta fue exitosa (ok: true)
        if (respuesta && respuesta.ok) {
            OcultarCargando(); // Ocultar loader antes de notificar
            MostrarMensaje(respuesta.mensaje || 'Categoría guardada correctamente.', true, false, false);
            
            // --- ACTUALIZAR WINDOW.CATEGORIAS EN TIEMPO REAL ---
            if (!window.categorias || !Array.isArray(window.categorias)) {
                window.categorias = [];
            }

            const tipo = datosGuardar.tipo || 'crear';

            if (tipo === 'editar') {
                const idEditado = Number(datosGuardar.id_categoria || datosGuardar.id);
                const nuevoNombre = (datosGuardar.nombre_categoria || '').trim().toUpperCase();
                const nuevosAtributos = datosGuardar.atributos || [];

                window.categorias = window.categorias.map(cat => {
                    let catId = Number(cat.id || cat.ID || cat.id_categoria);
                    if (catId === idEditado) {
                        return { 
                            ...cat, 
                            nombre_categoria: nuevoNombre, 
                            Nombre: nuevoNombre, 
                            atributos: nuevosAtributos 
                        };
                    }
                    return cat;
                });

            } else {
                // Creación de categoría con sus atributos
                let nombreUnico = (datosGuardar.nombre_categoria || '').trim().toUpperCase();
                let nuevoId = respuesta.data && (respuesta.data.id || respuesta.data.id_categoria) ? (respuesta.data.id || respuesta.data.id_categoria) : null;
                let atributosCreados = datosGuardar.atributos || [];

                if (nombreUnico) {
                    window.categorias.push({
                        id: nuevoId,
                        ID: nuevoId,
                        id_categoria: nuevoId,
                        nombre_categoria: nombreUnico,
                        Nombre: nombreUnico,
                        atributos: atributosCreados
                    });
                }
            }
            // -------------------------------------------------------------------------

            // --- LIMPIEZA COMPLETA DE LA INTERFAZ Y FORMULARIO ---
            if (typeof LimpiarFormularioCategoria === 'function') {
                LimpiarFormularioCategoria();
            } else {
                // Limpieza manual de respaldo si la función global no está declarada
                $("#crear-categoria-input-nombre").val('');
                const $tarjetasSeleccionadas = $('.tarjeta-atributo-item');
                $tarjetasSeleccionadas.fadeOut(200, function () {
                    $(this).remove();
                });
            }

            // Reseteo de contadores y estados de atributos
            window.total_atributos_activos = 0;
            $("#contador-atributos").text('0 atributos');
            $("#contenedor-atributos-acciones").hide();

            if (typeof CategoriasSelectionController !== 'undefined' && typeof CategoriasSelectionController.sincronizarDOM === 'function') {
                CategoriasSelectionController.sincronizarDOM();
            }

            const $contenedor = $("#categorias-contenedor-tabla");
            if ($contenedor.length && typeof Contenedor_Agregar === 'function') {
                Contenedor_Agregar('Agrega un atributo', $contenedor);
            }
            // -------------------------------------------------------------------------

            // Definimos el tipo de notificación según la acción ejecutada
            let notificacion = 'categoria_guardada';
            if (tipo === 'editar') {
                notificacion = 'categoria_editada';
            }

            $.messenger.send(
                window.parent,                        // Ventana padre
                notificacion,                         // Nombre de la acción
                { status: 'success', mensaje: 'Proceso completado', tipo: tipo },
                '*'
            );

            // Cerramos el modal solo si el proceso fue completamente exitoso
            setTimeout(() => {
                ModalAPI.cerrar();
            }, 1000);

        } else {
            // Si la respuesta llega aquí pero con ok: false controlado
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar la operación.';
            OcultarCargando();
            MostrarMensaje(mensajeError, false, false, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error al guardar la información de la categoría:", error);
        
        let mensajeServidor = '';
        if (error.response && error.response.mensaje) {
            mensajeServidor = error.response.mensaje;
        } else if (error.mensaje) {
            mensajeServidor = error.mensaje;
        } else if (typeof error === 'string') {
            mensajeServidor = error;
        }

        if (mensajeServidor && (mensajeServidor.includes('registrada') || mensajeServidor.includes('duplicado') || mensajeServidor.includes('obligatorio'))) {
            MostrarMensaje(mensajeServidor, false, true, false);
        } else {
            MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
        }
    }
}