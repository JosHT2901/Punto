window.multiple = false;
window.mostrar_plantilla = false;
window.direccion_plantilla = null;
window.tipo_archivos = null;
let archivosSeleccionados = []; // Almacén temporal para cuando multiple sea true

$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {

    window.multiple = data.multiple;
    window.mostrar_plantilla = data.mostrar_plantilla;
    window.tipo_archivos = data.tipo_archivos;
    
    // Si viene en true, mostramos el contenedor del botón de envío general
    if (window.multiple) {
        $("#contenedor-boton-enviar").removeClass('d-none');
    }
    if (window.mostrar_plantilla) {
        $("#contenedor-plantilla").removeClass('d-none');
        window.url_plantilla = data.url_plantilla;
        $("#btn-descargar-plantilla").off('click').on('click', function(e) {
            Evento_Click_Boton_Plantilla();
        });
    }

    const $contenedor =$('#mi-contenedor');

    // 1. Aseguramos que existan las secciones internas dentro de #mi-contenedor
    if ($('#mi-panel-inicial').length === 0) {
        $contenedor.html(`
            <!-- Panel grande inicial -->
            <div id="mi-panel-inicial" class="dds-ui-inicial h-p-100" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30px 24px; border: 2px dashed #cbd5e1; border-radius: 16px; background: #ffffff; width: 100%; box-sizing: border-box; cursor: pointer;">
                <div style="width: 56px; height: 56px; border-radius: 14px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin-bottom: 14px;">
                    <i class="icon vf-ic_fluent_document_24_filled" style="font-size: 26px; color: #03618d;"></i>
                </div>
                <div style="font-size: 14.5px; font-weight: 600; color: #0f172a; margin-bottom: 4px; user-select: none;">Suelta tu archivo</div>
                <div style="font-size: 12.5px; color: #64748b; margin-bottom: 16px; user-select: none;">Formatos permitidos:</div>
                <span style="display: inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border-radius: 20px; font-size: 11.5px; font-weight: 500; margin-bottom: 18px; border: 1px solid #e2e8f0;">${window.tipo_archivos.toUpperCase()}</span>
                <div style="display: flex; align-items: center; gap: 12px; width: 100%; max-width: 200px; margin-bottom: 18px;">
                    <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">ó</span>
                    <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
                </div>
                <button type="button" id="btn-examinar-externo" style="background-color: #03618d; color: #ffffff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                    <i class="icon vf-ic_fluent_folder_open_24_filled" style="font-size: 16px;"></i>
                    <span>Examinar archivos</span>
                </button>
            </div>

            <!-- Botón compacto alternativo (se muestra solo cuando ya hay tarjetas arriba) -->
            <div id="contenedor-btn-agregar-otro" class="h-35" style="display: none; margin-bottom: 10px; width: 100%; justify-content: flex-end;">
                <button type="button" class="btn btn-primary flex" id="btn-agregar-otro">
                    <i class="icon vf-ic_fluent_add_24_filled" style="font-size: 15px;"></i>
                    <span>Agregar otro archivo</span>
                </button>
            </div>

            <!-- Contenedor de la lista de tarjetas -->
            <div id="lista-tarjetas-cargadas" style="display: flex; flex-direction: column; gap: 8px; width: 100%;"></div>
        `);
    }

    if (window.multiple) {
        $("#contenedor-boton-enviar").removeClass('d-none');
    }

    const $panelInicial =$('#mi-panel-inicial');
    const $btnContenedorAlternativo =$('#contenedor-btn-agregar-otro');
    const $listaTarjetas =$('#lista-tarjetas-cargadas');

    // 2. Eventos para abrir el explorador
    $('#btn-examinar-externo, #btn-agregar-otro').off('click').on('click', function (e) {
        e.stopPropagation();
        $contenedor.data('abrirExplorador')();
    });

    $panelInicial.off('click').on('click', function () {$contenedor.data('abrirExplorador')();
    });

    // 3. Inicializamos el motor Drag & Drop en todo el contenedor principal
    $contenedor.GenerarAreaDragDrop({
        tipo: 'archivo',
        formatos: window.tipo_archivos,
        multiple: window.multiple,
        onDrop: function (archivo) {
            console.log("Archivo seleccionado:", archivo);

            // Si es multiple false, limpiamos array anterior y tarjetas visuales previas
            if (!window.multiple) {
                archivosSeleccionados = [];
                $listaTarjetas.empty();
            }

            const archivoObj = Array.isArray(archivo) ? archivo[0] : archivo;
            archivosSeleccionados.push(archivoObj);

            // Ocultamos el panel grande y mostramos el botón compacto
            $panelInicial.hide();$btnContenedorAlternativo.css('display', 'flex');

            const nombreArchivo = archivoObj.name || "archivo_cargado.pdf";
            const idUnico = 'tarjeta-onda-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

            // Creamos la tarjeta
            const htmlTarjeta = `
                <div class="archivo-card-container" id="${idUnico}" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); width: 100%; box-sizing: border-box; gap: 12px;" data-nombre="${nombreArchivo}">
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1; min-width: 0;">
                        <div id="onda-${idUnico}" style="width: 38px; height: 38px; position: relative; flex-shrink: 0;"></div>
                        <span style="font-size: 13.5px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombreArchivo}">${nombreArchivo}</span>
                    </div>
                    <div style="display: flex; align-items: center; flex-shrink: 0;">
                        <a type="button" class="btn btn-secondary rounded-3xl w-30 h-30 justify-center items-center p-0 fw-600 flex shrink-0 btn-eliminar-tarjeta" data-target="${idUnico}" style="cursor: pointer; text-decoration: none;">
                            <i class="ph ph-x"></i>
                        </a>
                    </div>
                </div>
            `;

            $listaTarjetas.prepend(htmlTarjeta);
            const $divOndaTarjeta =$('#onda-' + idUnico);

            // Obtenemos la ruta del icono dinámicamente usando el servicio independiente FileIconService
            const urlIconoDinamico = FileIconService.obtenerPorMime(archivoObj.type);

            // Inicializamos el ondaLoader con el icono correcto según la extensión/MIME
            $divOndaTarjeta.ondaLoader({
                progreso: 0,
                radio: 90,
                color: '#23c8fa',
                frecuencia: 10,
                amplitud: 3,
                imagenSize: '110px',
                imagenSizeFull: '130px',
                imagenUrl: urlIconoDinamico
            });

            // Simulamos el progreso
            let progresoActual = 0;
            const intervaloCarga = setInterval(() => {
                progresoActual += 25;
                const actualizarProgreso = $divOndaTarjeta.data('actualizar');

                if (progresoActual <= 100 && actualizarProgreso) {
                    actualizarProgreso(progresoActual);
                }

                if (progresoActual >= 100) {
                    clearInterval(intervaloCarga);

                    // REGLA: Si multiple es false, enviamos el mensaje inmediatamente al terminar la carga
                    if (!window.multiple) {
                        Enviar_Archivos(archivoObj);
                    }
                }
            }, 150);
        }
    });

    // 4. Lógica de eliminación de tarjetas
    $(document).on('click', '.btn-eliminar-tarjeta', function () {
        const idTarjeta = $(this).data('target');
        const $tarjeta =$('#' + idTarjeta);
        const nombreAEliminar = $tarjeta.attr('data-nombre');

        // Quitamos del arreglo global si es múltiple
        archivosSeleccionados = archivosSeleccionados.filter(f => f.name !== nombreAEliminar);

        $tarjeta.remove();

        // Si ya no quedan tarjetas, ocultamos el botón compacto y volvemos a mostrar el panel inicial grande
        if ($listaTarjetas.children().length === 0) {
            $btnContenedorAlternativo.hide();$panelInicial.show();
        }
    });

    // 5. Envío por botón cuando window.multiple es true
    $('#boton-enviar-archivo').off('click').on('click', function () {
        if (archivosSeleccionados.length === 0) {
            console.warn("No hay archivos seleccionados para enviar.");
            return;
        }
        Enviar_Archivos(archivosSeleccionados);
    });
    OcultarCargando()
});
$(document).ready(function(e)
{
    MostrarCargando('Obteniendo información...')
})
function Enviar_Archivos(datosAEnviar) {
    $.messenger.send(
        window.parent, // Ventana padre
        'Archivos_cargados', // Nombre de la acción
        {
            status: 'success',
            mensaje: 'Archivos_cargados',
            data: datosAEnviar
        },
        '*'
    );
}

async function Evento_Click_Boton_Plantilla() {
    try {
        // 1. Mostramos indicador de carga si lo tienes disponible
        if (typeof MostrarCargando === 'function') {
            MostrarCargando();
        }

        // 2. Esperamos la promesa de la descarga usando 'await'
        const respuesta = await window.AjaxService.descargarArchivo(
            '../../../src/controllers/php/controllers/archivos.php', {
                accion: 'descargar_plantilla',
                url:window.url_plantilla
            },
            false,
            'descarga.xlsx',
            false 
        );

        // 3. Ocultamos el indicador de carga
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        console.log("Respuesta de descarga:", respuesta);

        // Como pasamos ejecutarClick: false, tu promesa devuelve { ok: true, blob: ..., nombre: ... }
        if (respuesta && respuesta.ok) {
            // 4. Mostramos la pregunta de confirmación
            const confirma = await MostrarPregunta({
                titulo: 'Descargar archivo',
                texto: 'Archivo listo para descargar',
                icono: 'fa-solid fa-download text-gray-500',
                confirmarText: 'Descargar',
                colorConfirmar: 'btn-primary',
                altura: 320
            });

            // 5. Si el usuario confirma, ejecutamos el disparo manual de la descarga con el blob recibido
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
            }
        }
    } catch (error) {
        // Manejo de errores (captura el reject de tu XMLHttpRequest si falla o retorna JSON de error)
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error en la descarga:", error);

        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(error.mensaje || 'Error al procesar la descarga', 230, true);
        }
    }
}