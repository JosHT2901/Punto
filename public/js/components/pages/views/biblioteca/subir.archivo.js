function Carga_Archivo(e) {
    e.stopPropagation();
    const $contenedor = $('#contenedor-principal');
    const $inputOculto = $contenedor.find('.dds-input-oculto');
    if ($inputOculto.length) {
        $inputOculto[0].click();
    }
}

async function subirArchivos(archivos, subaccion = 'ninguna') {
    const accionFinal = subaccion !== 'ninguna' ? subaccion : ((typeof decisionGlobal !== 'undefined' ? decisionGlobal : null) || 'ninguna');
    const listaArchivos = Array.isArray(archivos) ? archivos : Array.from(archivos);

    if (listaArchivos.length === 0) return;

    // 1. Crear el contenedor global flotante si no existe
    if ($('#contenedor-progreso-global').length === 0) {
        $('body').append(`
            <div id="contenedor-progreso-global" style="position:fixed; bottom:20px; right:20px; width:320px; max-width:90vw; z-index:99999; display:flex; flex-direction:column-reverse; gap:10px; max-height:60vh; overflow-y:auto;"></div>
        `);
    }

    // 2. Procesar cada archivo de forma independiente
    listaArchivos.forEach(file => {
        const fileId = 'progreso-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Crear la tarjeta de progreso en el DOM
        $('#contenedor-progreso-global').append(`
            <div id="${fileId}" style="background:white; padding:12px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); border:1px solid #e2e8f0; display:flex; align-items:center; gap:12px;">
                <div class="loader-container" style="width: 50px; height: 50px; flex-shrink: 0;"></div>
                <div style="flex:1; min-width:0;">
                    <div class="file-name" style="font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #1e293b;" title="${file.name}">${file.name}</div>
                    <div class="file-status" style="font-size: 10px; color: #64748b; margin-top: 2px;">Subiendo... 0%</div>
                </div>
            </div>
        `);

        // Inicializar tu plugin ondaLoader dentro del contenedor
        const $loaderContainer = $(`#${fileId} .loader-container`);
        $loaderContainer.ondaLoader({
            progreso: 0,
            radio: 70,
            color: '#23c8fa',
            amplitud: 2,
            frecuencia: 8,
            imagenSize: '90px',
            imagenSizeFull: '100px'
        });

        const actualizarProgresoOnda = $loaderContainer.data('actualizar');

        // Construir el FormData específico para este archivo
        const formData = new FormData();
        formData.append('files[]', file);
        formData.append('accion', 'subir_archivos_biblioteca');
        formData.append('subaccion', accionFinal);

        // Usar AjaxService con progreso real basado en XHR nativo
        window.AjaxService.ejecutarPeticionSinModal(
            '../../../src/controllers/php/controllers/biblioteca.php',
            formData,
            true, // esFormData = true
            (porcentaje) => {
                if (typeof actualizarProgresoOnda === 'function') {
                    actualizarProgresoOnda(porcentaje);
                }
                $(`#${fileId} .file-status`).text(`Subiendo... ${porcentaje}%`);
            }
        ).then(async respuesta => {
            if (typeof actualizarProgresoOnda === 'function') {
                actualizarProgresoOnda(100);
            }
            $(`#${fileId} .file-status`).text('¡Completado!').css('color', '#10b981');

            // Remover la tarjeta después de 3 segundos
            setTimeout(() => {
                $(`#${fileId}`).fadeOut(400, function () {
                    $(this).remove();
                    if ($('#contenedor-progreso-global').children().length === 0) {
                        $('#contenedor-progreso-global').remove();
                    }
                });
            }, 3000);

            // --- ACTUALIZACIÓN DINÁMICA DE TIPOS DE ARCHIVO Y LISTADO ---
            try {
                const tiposRespuesta = await window.AjaxService.enviar(
                    '../../../src/controllers/php/controllers/biblioteca.php', 
                    { accion: 'obtener_tipos_archivos' }, 
                    false
                );

                if (tiposRespuesta && tiposRespuesta.ok && tiposRespuesta.data) {
                    window.tipos = tiposRespuesta;
                    const filtroTipo = window.filtrosConfiguracionBiblioteca?.find(f => f.id === 'f-tipo-archivo');
                    if (filtroTipo && tiposRespuesta.data.length > 0) {
                        filtroTipo.opciones = tiposRespuesta.data.map(t => ({
                            id: t.id,
                            texto: t.texto
                        }));

                        // Refrescar el carrusel de filtros si está disponible para mostrar el nuevo tipo al instante
                        if (window.FiltrosCarruselService && typeof window.FiltrosCarruselService.refrescar === 'function') {
                            window.FiltrosCarruselService.refrescar();
                        }
                    }
                }
            } catch (err) {
                console.error("No se pudieron actualizar los tipos de archivos tras la subida:", err);
            }

            // Refrescar la lista de la biblioteca automáticamente
            if (typeof window.offsetBiblioteca !== 'undefined') {
                window.offsetBiblioteca = 0;
            }
            if (typeof CargarArchivosBiblioteca === 'function') {
                CargarArchivosBiblioteca(true);
            }

        }).catch(async error => {
            console.log("Error capturado en AjaxService:", error);

            // Detectar con precisión el estatus HTTP 409 (Conflicto)
            const statusHttp = error.status || (error.response && error.response.status);

            if (statusHttp == 409) {
                // Extraer datos de conflicto considerando los niveles de anidación del AjaxService
                const responseData = error.response || {};
                const datosConflicto = responseData.data || responseData.response?.data || {};

                const cantidadDuplicados = datosConflicto.cantidad || 1;
                const esMultiples = cantidadDuplicados > 1;

                // Si es un solo archivo, mostramos su nombre real; si son varios, la cantidad
                const infoConflicto = esMultiples ? cantidadDuplicados : file.name;

                // Remover la tarjeta actual para abrir el modal de conflicto limpio
                $(`#${fileId}`).remove();
                if ($('#contenedor-progreso-global').children().length === 0) {
                    $('#contenedor-progreso-global').remove();
                }

                // Llamar al modal de conflictos rediseñado escuchando su Promesa con await
                if (typeof MostrarConflicto === 'function') {
                    const accionElegida = await MostrarConflicto(infoConflicto, esMultiples, 'archivo');
                    console.log("Acción elegida por el módulo:", accionElegida);
                    ModalAPI.cerrar();

                    // Si se cancela, detenemos el proceso de inmediato
                    if (accionElegida === 'cancelar') {
                        return;
                    }

                    // Reintentar la subida solo si eligió 'sobreescribir' o 'copia'
                    subirArchivos([file], accionElegida);
                } else {
                    console.error("La función MostrarConflicto no está definida.");
                }
                return;
            }

            // Manejo de errores estándar de red o servidor
            console.error("Error al subir archivo:", error);
            const mensajeError = (error.response && error.response.mensaje) || error.mensaje || 'Error al subir';

            $(`#${fileId} .file-status`).text(mensajeError).css('color', '#ef4444');
            $(`#${fileId}`).append(`
                <button type="button" onclick="$('#${fileId}').remove();" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; padding:0 4px;">&times;</button>
            `);
        });
    });
}