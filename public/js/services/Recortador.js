/**
 * Servicio Independiente y UI para el Recortador Profesional (Croppie + Drag & Drop + Flujo de Logo + BD)
 */
const RecortadorUI = {

    configDefault: {
        ancho: 650,
        alto: 150,
        altura: 250,
        minAncho: 650,
        minAlto: 150,
        colorPrimario: '#3b82f6'
    },

    _inyectarEstilos: function(colorPrimario) {
        if ($('#editor-croppie-v5-styles').length) return;
        $('head').append(`
            <style id="editor-croppie-v5-styles">
                .editor-container { 
                    display: flex; flex-direction: column; overflow: hidden; 
                    border: 1px solid #f1f5f9; position: relative; background: #fff;
                    border-radius: 8px;
                }
                .editor-viewport { flex: 1; background: #f8fafc; min-height: 0; cursor: move; position: relative; }
                .editor-toolbar { 
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; padding: 12px; border-top: 1px solid #f1f5f9; background: #fff;
                }
                .editor-range { 
                    flex: 1; max-width: 120px; accent-color: ${colorPrimario}; cursor: pointer;
                }
            </style>
        `);
    },

    /**
     * Inicializa el recortador genérico
     */
    init: function(selector, opciones) {
        const $padre = $(selector);
        if (!$padre.length) return null;

        if (typeof window.Croppie !== 'function') {
            console.error("El plugin Croppie no está cargado en el proyecto.");
            return null;
        }

        const config = $.extend({}, this.configDefault, opciones);
        this._inyectarEstilos(config.colorPrimario);
        this.destruir($padre);

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
                <input type="range" class="editor-range" min="0" max="2" step="0.01" value="1">
                <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto btn-z-in">
                    <i class="icon vf-ic_fluent_zoom_in_24_filled fs-5"></i>
                </button>
            </div>
        `);

        const $viewport = $padre.find('.editor-viewport');
        const $slider = $padre.find('.editor-range');

        const instancia = new Croppie($viewport[0], {
            viewport: { width: config.ancho, height: config.alto, type: config.forma || 'square' },
            boundary: { width: '100%', height: '100%' },
            showZoomer: false,
            enableOrientation: true,
            enableExif: true
        });

        $padre.data('croppieInstance', instancia);
        $viewport.data('croppieInstance', instancia);

        // Eventos toolbar
        $padre.off('click.rotL').on('click.rotL', '.btn-rot-l', (e) => { e.preventDefault(); instancia.rotate(-90); });
        $padre.off('click.rotR').on('click.rotR', '.btn-rot-r', (e) => { e.preventDefault(); instancia.rotate(90); });
        $slider.off('input.zoom').on('input.zoom', function() { instancia.setZoom(parseFloat($(this).val())); });
        
        $padre.off('click.zoomBtn').on('click.zoomBtn', '.btn-z-in, .btn-z-out', function(e) {
            e.preventDefault();
            const step = $(this).hasClass('btn-z-in') ? 0.1 : -0.1;
            const nuevoZoom = parseFloat($slider.val()) + step;
            if (nuevoZoom >= 0 && nuevoZoom <= 2) {
                instancia.setZoom(nuevoZoom);
                $slider.val(nuevoZoom);
            }
        });

        $viewport[0].addEventListener('update', (ev) => {
            if (ev.detail && typeof ev.detail.zoom === 'number') {
                $slider.val(ev.detail.zoom);
            }
        });

        return {
            cargar: (url) => instancia.bind({ url }),
            obtenerImagen: (cb, opts) => instancia.result($.extend({ type: 'base64', size: 'viewport', format: 'jpeg', quality: 0.9 }, opts)).then(cb),
            instancia: instancia
        };
    },

    /**
     * =========================================================================
     * FLUJO COMPLETO PARA LOGOTIPO DE EMPRESA (Soporta Archivos y URLs de BD)
     * =========================================================================
     * @param {string} selector Contenedor donde se montará el recortador
     * @param {File|Blob|string} [archivoInicial] Archivo local o URL de imagen proveniente de la base de datos
     */
    inicializarLogoEmpresa: function(selector, archivoInicial = null) {
        const self = this;
        const $contenedor = $(selector);
        if (!$contenedor.length) return;

        const procesarEntrada = (entrada) => {
            // 1. Si la entrada es un string (URL o ruta de la base de datos)
            if (typeof entrada === 'string' && entrada.trim() !== '') {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Evitar problemas de CORS si la imagen viene de otro dominio/servidor
                img.onload = function () {
                    const anchoReal = this.width;
                    const altoReal = this.height;

                    if (anchoReal < 650 || altoReal < 150) {
                        if (typeof MostrarAlerta === 'function') {
                            MostrarAlerta(`La imagen de la base de datos es muy pequeña (${anchoReal}x${altoReal}px). El tamaño mínimo recomendado es 650x150px.`, 300, false);
                        }
                    }

                    // Inicializar recortador con la URL de la base de datos
                    const apiRecortador = self.init($contenedor, { ancho: 650, alto: 150, altura: 250 });
                    apiRecortador.cargar(entrada);
                    window.miRecortadorActual = apiRecortador;

                    self._inyectarBotonGuardar();
                    self._vincularDragDropViewport($contenedor, procesarEntrada);
                };
                img.onerror = function() {
                    console.error("No se pudo cargar la imagen desde la ruta de la base de datos:", entrada);
                };
                img.src = entrada;
                return;
            }

            // 2. Si es un archivo local (File, Blob, FileList, etc.)
            let archivoReal = entrada;
            if (entrada && entrada.target && entrada.target.files) archivoReal = entrada.target.files[0];
            else if (entrada && (entrada instanceof FileList || Array.isArray(entrada) || entrada.length)) archivoReal = entrada[0];
            else if (entrada && entrada.dataTransfer && entrada.dataTransfer.files) archivoReal = entrada.dataTransfer.files[0];

            if (!(archivoReal instanceof Blob) && !(archivoReal instanceof File)) return;

            const lector = new FileReader();
            lector.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const anchoReal = this.width;
                    const altoReal = this.height;

                    if (anchoReal < 650 || altoReal < 150) {
                        if (typeof MostrarAlerta === 'function') {
                            MostrarAlerta(`La imagen es muy pequeña (${anchoReal}x${altoReal}px). El logotipo debe tener un tamaño mínimo de 650x150px.`, 300, false);
                        }
                        return;
                    }

                    const apiRecortador = self.init($contenedor, { ancho: 650, alto: 150, altura: 250 });
                    apiRecortador.cargar(e.target.result);
                    window.miRecortadorActual = apiRecortador;

                    self._inyectarBotonGuardar();
                    self._vincularDragDropViewport($contenedor, procesarEntrada);
                };
                img.src = e.target.result;
            };
            lector.readAsDataURL(archivoReal);
        };

        // Si se le pasa una imagen inicial (de BD o archivo), la procesa directamente
        if (archivoInicial) {
            procesarEntrada(archivoInicial);
        } else {
            // Si no hay imagen inicial, activamos el Drag & Drop en el contenedor vacío
            if (typeof window.DragDropService === 'object') {
                window.DragDropService.init($contenedor, {
                    tipo: 'imagen',
                    formatos: '.png,.jpg,.jpeg',
                    multiple: false,
                    onDrop: function (archivo) {
                        procesarEntrada(archivo);
                    }
                });
            }
        }
    },

    _inyectarBotonGuardar: function() {
        $("#contenedor-boton-guardar").html(`
            <a class="h-40 min-w-100 flex justify-center items-center rounded-md btn btn-primary" id="boton-guardar-imagen">
                <div class="h-p-100 flex justify-center items-center">
                    <span>Guardar</span>
                </div>
            </a>
        `);

        if (typeof Evento_Guardar_Imagen === 'function') {
            Evento_Guardar_Imagen();
        }
    },

    _vincularDragDropViewport: function($contenedor, callbackProcesar) {
        const $viewport = $contenedor.find('.editor-viewport');
        if (typeof window.DragDropService === 'object') {
            window.DragDropService.init($viewport, {
                tipo: 'imagen',
                formatos: '.png,.jpg,.jpeg',
                multiple: false,
                onDrop: function (nuevoArchivo) {
                    callbackProcesar(nuevoArchivo);
                }
            });
        }
    },

    destruir: function(selector) {
        const $padre = $(selector);
        if (!$padre.length) return;
        const instancia = $padre.data('croppieInstance');
        if (instancia && typeof instancia.destroy === 'function') {
            instancia.destroy();
        }
        $padre.removeData('croppieInstance').removeClass('editor-container').empty();
    }
};