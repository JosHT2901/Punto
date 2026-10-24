$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        let respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/marcas.php', {
            accion: 'obtener_marcas'
        });
        console.log(respuesta)
        OcultarCargando();
        if (respuesta && respuesta.ok) {
           window.marcas=respuesta.data
        }
        console.log(window.marcas)
        $(document).trigger('datosListos');

    } catch (error) {
        OcultarCargando();
        console.error("Error en la petición AJAX:", error);
        
        // 4. Error de red, 404, 500, etc.
        MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
    }
})

async function Guardar_Gestion_Marcas(datosGuardar) {
    try {
        MostrarCargando('Procesando información...', false); 

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/marcas.php', {
            accion: 'gestionar_marcas',
            data: datosGuardar
        });
        
        console.log("Respuesta del servidor:", respuesta);
        OcultarCargando();
        // Validamos si la respuesta fue exitosa (ok: true)
        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || 'Información guardada correctamente.', true, false, false);
            
            // --- LIMPIEZA COMPLETA DE CAMPOS Y FORMULARIOS ---
            // 1. Resetea cualquier formulario activo en el modal o vista
            $('form').each(function() {
                this.reset();
            });

            // 2. Limpia inputs de texto o selectores específicos de marcas si los hay
            $('#input-nombre-marca, #input-marca, .limpiar-al-guardar').val('');

            // 3. Si usas contenedores dinámicos o listas temporales, los vaciamos
            if (typeof LimpiarCamposTemporales === 'function') {
                LimpiarCamposTemporales();
            }
            // ------------------------------------------------

            // --- ACTUALIZAR WINDOW.MARCAS EN TIEMPO REAL ---
            if (!window.marcas || !Array.isArray(window.marcas)) {
                window.marcas = [];
            }

            const tipo = datosGuardar.tipo || 'unica';

            if (tipo === 'editar') {
                const idEditado = Number(datosGuardar.id);
                const nuevoNombre = (datosGuardar.nombre || '').trim().toUpperCase();

                window.marcas = window.marcas.map(m => {
                    let mId = Number(m.id || m.ID);
                    if (mId === idEditado) {
                        return { ...m, nombre: nuevoNombre, Nombre: nuevoNombre };
                    }
                    return m;
                });

            } else if (tipo === 'masivo') {
                if (datosGuardar.marcas && Array.isArray(datosGuardar.marcas)) {
                    datosGuardar.marcas.forEach(item => {
                        let nombreLimpio = (item.nombre || '').trim().toUpperCase();
                        if (nombreLimpio) {
                            window.marcas.push({
                                id: null,
                                ID: null,
                                nombre: nombreLimpio,
                                Nombre: nombreLimpio
                            });
                        }
                    });
                }

            } else {
                // Creación única
                let nombreUnico = (datosGuardar.nombre || '').trim().toUpperCase();
                let nuevoId = respuesta.data && respuesta.data.id ? respuesta.data.id : null;

                if (nombreUnico) {
                    window.marcas.push({
                        id: nuevoId,
                        ID: nuevoId,
                        nombre: nombreUnico,
                        Nombre: nombreUnico
                    });
                }
            }
            // ----------------------------------------------

            // Definimos el tipo de notificación según la acción ejecutada
            let notificacion = 'marca_guardada';
            if (tipo === 'editar') {
                notificacion = 'marca_editada';
            } else if (tipo === 'masivo') {
                notificacion = 'marcas_creadas';
            }

            // Enviamos los datos al padre asegurando incluir las propiedades necesarias
            $.messenger.send(
                window.parent,
                notificacion,
                { 
                    status: 'success', 
                    mensaje: 'Proceso completado', 
                    tipo: tipo,
                    mostrar_boton_varias: false 
                },
                '*'
            );

        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar la operación.';
            MostrarMensaje(mensajeError, false, false, false);
        }

    } catch (error) {
        console.error("Error al guardar la información de las marcas:", error);
        OcultarCargando();
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