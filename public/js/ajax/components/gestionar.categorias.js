$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);
        
        // 1. Obtener y desencriptar el ID de la categoría desde la URL (para modo edición)
        const urlParams = new URLSearchParams(window.location.search);
        let idCategoriaCifrado = urlParams.get('id');
        let idCategoria = idCategoriaCifrado ? Descifrar_Payload(idCategoriaCifrado) : null;

        console.log("ID de categoría desencriptado:", idCategoria);
        
        // Asignación directa a variables globales
        window.idCategoriaActual = idCategoria;
        window.esModoEdicion = Boolean(idCategoria);

        // Preparamos las peticiones AJAX en paralelo
        const promesas = [
            CargarJSON('../../../src/json/data/atributos.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
                accion: 'obtener_categorias'
            })
        ];

        // Si estamos editando, solicitamos mediante AJAX los datos específicos de la categoría
        if (window.esModoEdicion) {
            promesas.push(
                window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
                    accion: 'obtener_categoria_por_id',
                    id: idCategoria
                })
            );
        }

        const [respuestaAtributos, respuestaCategorias, respuestaDetalle] = await Promise.all(promesas);
        
        OcultarCargando();

        // 2. Almacenamiento en variables globales
        window.atributos = respuestaAtributos ? (respuestaAtributos.catalogo_tipos_datos || respuestaAtributos) : [];
        window.categorias = (respuestaCategorias && respuestaCategorias.ok) 
            ? (respuestaCategorias.data || respuestaCategorias.categorias || []) 
            : (Array.isArray(respuestaCategorias) ? respuestaCategorias : []);

        if (window.esModoEdicion && respuestaDetalle) {
            window.categoriaActualData = respuestaDetalle.data || respuestaDetalle.categoria || respuestaDetalle;
        } else {
            window.categoriaActualData = null;
        }

        console.log("Datos AJAX almacenados en variables globales:", {
            esModoEdicion: window.esModoEdicion,
            idCategoriaActual: window.idCategoriaActual,
            atributos: window.atributos,
            categorias: window.categorias,
            categoriaActualData: window.categoriaActualData
        });

        // 3. Disparamos el evento limpio para que la otra función procese leyendo las variables window
        $(document).trigger('datosListos');

    } catch (error) {
        OcultarCargando();
        console.error("Error al obtener la información inicial:", error);
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
});
async function Guardar_Gestion_Categorias(datosGuardar) {
    try {
        MostrarCargando('Procesando información...', false); 

        // Detectamos si estamos en modo edición ya sea por el ID global o por los datos pasados
        const idEdicion = window.idCategoriaActual || datosGuardar.id || datosGuardar.id_categoria || null;
        const tipoAccion = idEdicion ? 'editar' : 'crear';

        // Aseguramos que el objeto enviado contenga el tipo y el id si estamos editando
        const payloadFinal = {
            ...datosGuardar,
            tipo: datosGuardar.tipo || tipoAccion,
        };

        if (idEdicion && !payloadFinal.id && !payloadFinal.id_categoria) {
            payloadFinal.id = idEdicion;
        }

        // Ajusta la ruta del controlador de PHP según tu estructura de carpetas
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'gestionar_categorias',
            data: payloadFinal
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

            const tipo = payloadFinal.tipo;

            if (tipo === 'editar') {
                const idEditado = Number(payloadFinal.id_categoria || payloadFinal.id || idEdicion);
                const nuevoNombre = (payloadFinal.nombre_categoria || '').trim().toUpperCase();
                const nuevosAtributos = payloadFinal.atributos || [];

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
                let nombreUnico = (payloadFinal.nombre_categoria || '').trim().toUpperCase();
                let nuevoId = respuesta.data && (respuesta.data.id || respuesta.data.id_categoria) ? (respuesta.data.id || respuesta.data.id_categoria) : null;
                let atributosCreados = payloadFinal.atributos || [];

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
                window.parent,                    // Ventana padre
                notificacion,                     // Nombre de la acción
                { status: 'success', mensaje: 'Proceso completado', tipo: tipo },
                '*'
            );

            // Cerramos el modal solo si el proceso fue completamente exitoso
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                window.location.href = "../views/categorias.php";
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