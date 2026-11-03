$(document).ready(async function () {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        window.ID_Sucursal = await Enviar_Id(500); // Espera máximo 500ms
        console.log("ID de sucursal obtenido:", window.ID_Sucursal);

        const esEdicion = window.ID_Sucursal !== null && window.ID_Sucursal !== undefined && window.ID_Sucursal !== '';

        // Creamos el arreglo base de promesas en paralelo
        let promesas = [
            CargarJSON('../../../src/json/data/localidades.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
                accion: 'obtener_sucursales'
            })
        ];

        // 🌟 Si hay ID, agregamos la tercera petición en paralelo para obtener la sucursal específica
        if (esEdicion) {
            promesas.push(
                window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
                    accion: 'obtener_informacion_sucursal',
                    id: window.ID_Sucursal
                }).catch(() => null)
            );
        }

        // Ejecutamos todas las promesas en paralelo
        let resultados = await Promise.all(promesas);

        let localidades = resultados[0];
        let sucursales = resultados[1];
        let sucursalEspecificaRespuesta = esEdicion ? resultados[2] : null;

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        window.localidades = localidades || [];

        if (sucursales && sucursales.ok) {
            window.sucursales = sucursales.data;
        } else {
            // Soporte por si la respuesta viene directamente como un arreglo plano
            window.sucursales = Array.isArray(sucursales) ? sucursales : (sucursales.data || []);
        }

        // Si se obtuvo la sucursal específica, extraemos correctamente el objeto interior de la respuesta de PHP
        if (esEdicion && sucursalEspecificaRespuesta) {
            const respuestaData = sucursalEspecificaRespuesta.data || sucursalEspecificaRespuesta;
            window.sucursalEdicion = respuestaData.sucursal || respuestaData;
            console.log("Sucursal cargada para edición:", window.sucursalEdicion);
        } else {
            window.sucursalEdicion = null;
        }

        console.log("Localidades cargadas:", window.localidades);
        console.log("Sucursales cargadas:", window.sucursales);

        // Disparamos el evento personalizado pasando los datos relevantes
        $(document).trigger('datosListos.gestionSucursales', [esEdicion, window.sucursalEdicion]);

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al obtener los datos:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
        }
    }
});
// Función asíncrona para guardar o editar la sucursal conectando con el backend
async function Guardar_Gestion_Sucursal(datosGuardar) {
    try {
        MostrarCargando('Procesando información...', false); 

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
            accion: 'gestionar_sucursales',
            data: datosGuardar
        });
        
        console.log("Respuesta del servidor:", respuesta);

        if (respuesta && respuesta.ok) {
            // Ocultamos el cargador al tener éxito
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            MostrarMensaje(respuesta.mensaje || 'Sucursal guardada correctamente.', true, false, false);
            
            // --- ACTUALIZAR WINDOW.SUCURSALES EN TIEMPO REAL ---
            if (!window.sucursales || !Array.isArray(window.sucursales)) {
                window.sucursales = [];
            }

            const idEditado = datosGuardar.id ? Number(datosGuardar.id) : null;

            if (idEditado) {
                window.sucursales = window.sucursales.map(s => {
                    let sId = Number(s.id || s.ID);
                    if (sId === idEditado) {
                        return { ...s, ...datosGuardar };
                    }
                    return s;
                });
            } else {
                let nuevoId = (respuesta.data && (respuesta.data.id || respuesta.data.ID)) ? (respuesta.data.id || respuesta.data.ID) : null;
                window.sucursales.push({
                    id: nuevoId,
                    ID: nuevoId,
                    ...datosGuardar
                });
            }

            // Determinamos con precisión si fue edición o nuevo registro
            const sucursalIdFinal = idEditado || (respuesta.data && (respuesta.data.id || respuesta.data.ID)) || null;
            const accionNotificacion = idEditado ? 'sucursal_editada' : 'sucursal_guardada';
            
            // Llamada correcta a $.messenger.send adaptada al framework
            $.messenger.send(
                window.parent,
                accionNotificacion,
                { status: 'success', mensaje: 'Proceso completado', id: sucursalIdFinal },
                '*'
            );

            if (typeof LimpiarFormularioSucursal === 'function') {
                LimpiarFormularioSucursal();
            }

            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);

        } else {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo completar la operación.';
            MostrarMensaje(mensajeError, false, false, false);
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al guardar la información de la sucursal:", error);
        
        let mensajeServidor = '';
        if (error.response && error.response.mensaje) {
            mensajeServidor = error.response.mensaje;
        } else if (error.mensaje) {
            mensajeServidor = error.mensaje;
        } else if (typeof error === 'string') {
            mensajeServidor = error;
        }

        if (mensajeServidor && (mensajeServidor.includes('registrada') || mensajeServidor.includes('duplicado') 
            || mensajeServidor.includes('obligatorio'))) {
            MostrarMensaje(mensajeServidor, false, true, false);
        } else {
            MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, true, false);
        }
    }
}

function LimpiarFormularioSucursal() {
    // 1. Limpiar inputs de texto y numéricos dentro del formulario general
    $("#form-gestion-sucursal input[type='text'], #form-gestion-sucursal input[type='number']").val('');

    // 2. Restablecer selectores personalizados usando el motor CustomSelect (V3.5.2)
    if (typeof CustomSelect !== 'undefined') {
        CustomSelect.reset('#select-custom-tipo-sucursal', false);
        CustomSelect.reset('#select-estado', false);
        CustomSelect.reset('#select-municipio', false);
        CustomSelect.reset('#select-localidad', false);
    }

    // 3. Vaciar contenedores dependientes en cascada (Municipio y Localidad)
    $('#contenedor-select-municipio').empty();
    $('#contenedor-select-localidad').empty();

    // 4. Limpiar componentes de teléfonos con intl-tel-input
    if (typeof TelefonosUI !== 'undefined') {
        TelefonosUI.limpiar("#sucursal-input-telefono");
        TelefonosUI.limpiar("#sucursal-input-telefono-adicional");
        TelefonosUI.limpiar("#sucursal-input-whatsapp");
    }

    // 5. Limpiar mensajes de error y referencia de edición
    $("#sucursal-span-tipo").text('');
    window.sucursalEdicion = null;

    // 6. Reiniciar el Wizard de Acordeones de forma fluida a la primera tarjeta
    const $wizardContainer = $('.js-wizard-container').first();
    if ($wizardContainer.length) {
        const $tarjetas = $wizardContainer.find('.js-acordeon-container');
        
        $tarjetas.each(function(index) {
            const $card = $(this);
            const $panel = $card.find('.js-panel-toggle').first();
            const $icon = $card.find('.js-icon-toggle').first();

            if (index === 0) {
                // Abrimos la primera tarjeta del wizard
                $panel.stop(true, true).slideDown(250);
                $icon.addClass('is-rotated');
                
                // Enfocar el primer input de la primera tarjeta de forma segura
                setTimeout(() => {
                    const inputsSelector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), input[readonly].input, select:not([disabled])';
                    const $primerInput = $card.find(inputsSelector).first();
                    if ($primerInput.length) {
                        const el = $primerInput[0];
                        if (el && typeof el.focus === 'function') {
                            el.focus();
                            if (typeof el.select === 'function') el.select();
                        }
                    }
                }, 300);
            } else {
                // Cerramos el resto de tarjetas del wizard
                $panel.stop(true, true).slideUp(200);
                $icon.removeClass('is-rotated');
            }
        });

        // Llevar el scroll suavemente hasta el inicio del formulario
        $('html, body').stop(true, true).animate({
            scrollTop: $wizardContainer.offset().top - 20
        }, 300);
    }
}