/**
 * API de Recorte Profesional v5.1 - Blindada y Optimizada
 * Soporte para rotación, persistencia de instancia y sincronización de zoom nativa.
 */
$.fn.InicializarRecortador = function(opciones) {
    const $padre = this;
    if (!$padre.length) return null;

    const config = $.extend({
        ancho: 200,
        alto: 200,
        altura: 384,
        forma: 'square',
        colorPrimario: '#3b82f6'
    }, opciones);

    // 1. Validar dependencia de Croppie
    if (typeof Croppie === 'undefined') {
        console.error('InicializarRecortador: La librería Croppie.js no está cargada.');
        return null;
    }

    // 2. Destruir instancia previa si existe para evitar conflictos
    const instanciaPrevia = $padre.data('croppie_instance');
    if (instanciaPrevia && typeof instanciaPrevia.destroy === 'function') {
        instanciaPrevia.destroy();
        $padre.off('.croppie_v5');
    }

    // 3. Inyección de Estilos Globales (una sola vez)
    if (!$('#editor-croppie-v5-styles').length) {
        $('head').append(`
            <style id="editor-croppie-v5-styles">
                .editor-container { 
                    display: flex; flex-direction: column; overflow: hidden; 
                    border: 1px solid #f1f5f9; position: relative; background: #fff;
                }
                .editor-viewport { flex: 1; background: #f8fafc; min-height: 0; cursor: move; }
                .editor-toolbar { 
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; padding: 12px; border-top: 1px solid #f1f5f9; background: #fff;
                }
                .editor-range { 
                    flex: 1; max-width: 120px; accent-color: ${config.colorPrimario}; cursor: pointer;
                }
                .btn-recorte {
                    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
                    border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #64748b;
                    transition: all 0.2s; cursor: pointer;
                }
                .btn-recorte:hover { background: #f1f5f9; color: ${config.colorPrimario}; }
                .btn-recorte:active { transform: scale(0.95); }
            </style>
        `);
    }

    // 4. Construcción de Interfaz
    $padre.addClass('editor-container').css('height', config.altura + 'px').html(`
        <div class="editor-viewport"></div>
        <div class="editor-toolbar">
            <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto btn-rot-l" title="Girar Izquierda">
                <i class="icon vf-ic_fluent_arrow_rotate_clockwise_24_filled fs-5"></i>
            </button>
            <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto btn-rot-r" title="Girar Derecha">
                <i class="icon vf-ic_fluent_arrow_rotate_counterclockwise_24_filled fs-5"></i>
            </button>
            
            <div style="width: 1px; height: 24px; background: #e2e8f0; margin: 0 5px;"></div>
            
            <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto btn-z-out">
                <i class="icon vf-ic_fluent_zoom_out_24_filled fs-5"></i>
            </button>
            <input type="range" class="editor-range" min="0" max="1.5" step="0.001" value="0">
            <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto btn-z-in">
                <i class="icon vf-ic_fluent_zoom_in_24_filled fs-5"></i>
            </button>
        </div>
    `);

    const $viewport =$padre.find('.editor-viewport');
    const $slider =$padre.find('.editor-range');

    // 5. Inicialización de Croppie
    const instancia = new Croppie($viewport[0], {
        viewport: { width: config.ancho, height: config.alto, type: config.forma },
        boundary: { width: '100%', height: '100%' },
        showZoomer: false,
        enableOrientation: true,
        enableExif: true
    });

    // Guardar referencias en los elementos DOM
    $viewport.data('croppie', instancia);
    $padre.data('croppie', instancia);$padre.data('croppie_instance', instancia);

    // 6. Sincronización de eventos de Zoom y UI con Namespaces (.croppie_v5)
    $padre.on('click.croppie_v5', '.editor-toolbar', (e) => e.stopPropagation());

    $padre.on('click.croppie_v5', '.btn-rot-l', (e) => {          e.preventDefault();          instancia.rotate(-90);      });$padre.on('click.croppie_v5', '.btn-rot-r', (e) => { 
        e.preventDefault(); 
        instancia.rotate(90); 
    });

    $slider.on('input.croppie_v5', function() { 
        instancia.setZoom(parseFloat($(this).val())); 
    });

    $padre.on('click.croppie_v5', '.btn-z-in, .btn-z-out', function(e) {
        e.preventDefault();
        const currentZoom = parseFloat($slider.val()) || 0;
        const step = $(this).hasClass('btn-z-in') ? 0.1 : -0.1;
        const nuevoZoom = Math.max(parseFloat($slider.attr('min')) || 0, Math.min(parseFloat($slider.attr('max')) || 1.5, currentZoom + step));
        instancia.setZoom(nuevoZoom);
    });

    // Escuchar cambios nativos de Croppie para actualizar los límites y posición del slider
    $viewport[0].addEventListener('update', (ev) => {
        if (ev.detail) {
            if (ev.detail.min !== undefined && ev.detail.max !== undefined) {
                $slider.attr('min', ev.detail.min);$slider.attr('max', ev.detail.max);
            }
            if (ev.detail.zoom !== undefined) {
                $slider.val(ev.detail.zoom);
            }
        }
    });

    // 7. Retorno de API Privada y Robusta
    return {
        cargar: (archivo) => {
            return new Promise((resolve, reject) => {
                if (!archivo) {
                    reject('No se proporcionó ningún archivo o URL.');
                    return;
                }

                if (typeof archivo === 'string') {
                    instancia.bind({ url: archivo }).then(resolve).catch(reject);
                } else if (archivo instanceof File || archivo instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        instancia.bind({ url: e.target.result }).then(resolve).catch(reject);
                    };
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(archivo);
                } else {
                    reject('Formato de archivo no soportado.');
                }
            });
        },
        obtenerImagen: (opcionesResult = {}) => {
            const defaults = {
                type: 'base64',
                size: 'viewport',
                format: 'jpeg',
                quality: 0.9
            };
            return instancia.result($.extend({}, defaults, opcionesResult));
        },
        destruir: () => {
            if (typeof instancia.destroy === 'function') {
                instancia.destroy();
            }
            $padre.off('.croppie_v5').empty().removeClass('editor-container').css('height', '');
        },
        instancia: instancia
    };
};