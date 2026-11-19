const RecortadorUI = {

    configDefault: {
        ancho: 250,
        alto: 250,
        altura: 350,
        forma: 'square',
        minAncho: 200,
        minAlto: 200,
        validarDimensiones: true,
        etiquetaTipo: 'imagen',
        colorPrimario: '#3b82f6',
        contenedorBotonGuardar: '#contenedor-boton-guardar',
        botonGuardarId: 'boton-guardar-imagen',
        onImagenLista: null
    },

    presets: {
        logoEmpresa: {
            ancho: 650,
            alto: 150,
            altura: 250,
            forma: 'square',
            minAncho: 650,
            minAlto: 150,
            validarDimensiones: true,
            etiquetaTipo: 'logotipo'
        },
        perfilUsuario: {
            ancho: 250,         // Tamaño final del recorte (ancho)
            alto: 250,         // Tamaño final del recorte (alto)
            altura: 340,       // Altura visual del contenedor en la interfaz
            forma: 'circle',   // Forma del recorte circular
            minAncho: 150,     // Mínimo ancho permitido para validar (coherente con el recorte)
            minAlto: 150,      // Mínimo alto permitido para validar
            validarDimensiones: false, // En false permite subir cualquier imagen y la adapta
            etiquetaTipo: 'foto de perfil'
        },
        portada: {
            ancho: 800,
            alto: 220,
            altura: 320,
            forma: 'square',
            minAncho: 800,
            minAlto: 220,
            validarDimensiones: true,
            etiquetaTipo: 'portada'
        }
    },

    _inyectarEstilos: function (colorPrimario) {
        if ($('#editor-croppie-v5-styles').length) return;
        $('head').append(`
            <style id="editor-croppie-v5-styles">
                .editor-container { 
                    display: flex; flex-direction: column; overflow: hidden; 
                    border: 1px solid #f1f5f9; position: relative; background: #fff;
                    border-radius: 8px; width: 100%; box-sizing: border-box;
                }
                .editor-viewport { 
                    flex: 1; background: #f8fafc; min-height: 0; cursor: move; 
                    position: relative; width: 100%; 
                }
                .editor-toolbar { 
                    display: flex; align-items: center; justify-content: space-between;
                    flex-wrap: wrap; width: 100%; box-sizing: border-box;
                    gap: 8px; padding: 10px 12px; border-top: 1px solid #f1f5f9; background: #fff;
                }
                .editor-toolbar .btn {
                    flex-shrink: 0; margin: 0 !important;
                }
                .editor-toolbar-grupo {
                    display: flex; align-items: center; gap: 6px;
                }
                .editor-toolbar-zoom {
                    display: flex; align-items: center; gap: 8px; flex: 1; min-width: 140px;
                }
                .editor-range { 
                    flex: 1; width: 100%; min-width: 60px; max-width: none; 
                    accent-color: ${colorPrimario}; cursor: pointer;
                }
            </style>
        `);
    },

    init: function (selector, opciones) {
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
                <div class="editor-toolbar-grupo">
                    <button type="button" class="btn h-40 px-3 btn-secondary rounded-md flex justify-center items-center gap-2 btn-cambiar-img" title="Cambiar imagen">
                        <i class="icon vf-ic_fluent_folder_open_24_filled fs-5"></i>
                        <span class="fs-3 fw-medium">Cambiar</span>
                    </button>
                    <input type="file" class="editor-input-archivo d-none" accept=".png,.jpg,.jpeg,image/png,image/jpeg">

                    <div style="width: 1px; height: 24px; background: #e2e8f0; margin: 0 2px;"></div>

                    <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center btn-rot-l" title="Girar Izquierda">
                        <i class="icon vf-ic_fluent_arrow_rotate_clockwise_24_filled fs-5"></i>
                    </button>
                    <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center btn-rot-r" title="Girar Derecha">
                        <i class="icon vf-ic_fluent_arrow_rotate_counterclockwise_24_filled fs-5"></i>
                    </button>
                </div>
                
                <div class="editor-toolbar-zoom">
                    <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center btn-z-out" title="Alejar">
                        <i class="icon vf-ic_fluent_zoom_out_24_filled fs-5"></i>
                    </button>
                    <input type="range" class="editor-range" min="0" max="2" step="0.01" value="1">
                    <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center btn-z-in" title="Acercar">
                        <i class="icon vf-ic_fluent_zoom_in_24_filled fs-5"></i>
                    </button>
                </div>
            </div>
        `);

        const $viewport = $padre.find('.editor-viewport');
        const $slider = $padre.find('.editor-range');
        const $inputArchivo = $padre.find('.editor-input-archivo');

        const instancia = new Croppie($viewport[0], {
            viewport: { width: config.ancho, height: config.alto, type: config.forma },
            boundary: { width: '100%', height: '100%' },
            showZoomer: false,
            enableOrientation: true,
            enableExif: true
        });

        $padre.data('croppieInstance', instancia);
        $viewport.data('croppieInstance', instancia);

        // Evento para abrir el selector de archivos al pulsar "Cambiar"
        $padre.off('click.cambiarImg').on('click.cambiarImg', '.btn-cambiar-img', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $inputArchivo.val('').trigger('click');
        });

        // Evento cuando el usuario selecciona un nuevo archivo desde el input
        $inputArchivo.off('change.cambiarImg').on('change.cambiarImg', function (e) {
            if (typeof config._onSeleccionarArchivo === 'function' && this.files && this.files[0]) {
                config._onSeleccionarArchivo(this.files[0]);
            }
        });

        $padre.off('click.rotL').on('click.rotL', '.btn-rot-l', (e) => { e.preventDefault(); instancia.rotate(-90); });
        $padre.off('click.rotR').on('click.rotR', '.btn-rot-r', (e) => { e.preventDefault(); instancia.rotate(90); });
        $slider.off('input.zoom').on('input.zoom', function () { instancia.setZoom(parseFloat($(this).val())); });

        $padre.off('click.zoomBtn').on('click.zoomBtn', '.btn-z-in, .btn-z-out', function (e) {
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

    inicializar: function (selector, archivoInicial = null, contextoOConfig = {}) {
        const self = this;
        const $contenedor = $(selector);
        if (!$contenedor.length) return;

        let opcionesContexto = {};
        if (typeof contextoOConfig === 'string' && this.presets[contextoOConfig]) {
            opcionesContexto = this.presets[contextoOConfig];
        } else if (typeof contextoOConfig === 'object' && contextoOConfig !== null) {
            opcionesContexto = contextoOConfig;
        }

        const config = $.extend({}, this.configDefault, opcionesContexto);

        const montarEnCroppie = (fuenteImagen) => {
            // Conectamos el callback para que el botón "Cambiar" reprocese la nueva imagen
            const configConCallback = $.extend({}, config, {
                _onSeleccionarArchivo: (nuevoArchivo) => procesarEntrada(nuevoArchivo)
            });

            const apiRecortador = self.init($contenedor, configConCallback);
            if (!apiRecortador) return;

            apiRecortador.cargar(fuenteImagen);
            window.miRecortadorActual = apiRecortador;

            self._inyectarBotonGuardar(config);
            self._vincularDragDropViewport($contenedor, procesarEntrada);

            if (typeof config.onImagenLista === 'function') {
                config.onImagenLista(apiRecortador);
            }
        };

        const validarDimensionesImagen = (anchoReal, altoReal, esDesdeBD = false) => {
            if (!config.validarDimensiones) return true;

            if (anchoReal < config.minAncho || altoReal < config.minAlto) {
                if (typeof MostrarAlerta === 'function') {
                    const origenTexto = esDesdeBD ? 'de la base de datos ' : '';
                    MostrarAlerta(
                        `La imagen ${origenTexto}es muy pequeña (${anchoReal}x${altoReal}px). El tamaño mínimo para ${config.etiquetaTipo} es ${config.minAncho}x${config.minAlto}px.`,
                        300,
                        false
                    );
                }
                return esDesdeBD;
            }
            return true;
        };

        const procesarEntrada = (entrada) => {
            if (typeof entrada === 'string' && entrada.trim() !== '') {
                const img = new Image();
                if (!entrada.startsWith('data:')) {
                    img.crossOrigin = "anonymous";
                }
                img.onload = function () {
                    validarDimensionesImagen(this.width, this.height, true);
                    montarEnCroppie(entrada);
                };
                img.onerror = function () {
                    console.error("No se pudo cargar la imagen desde la fuente proporcionada:", entrada);
                };
                img.src = entrada;
                return;
            }

            let archivoReal = entrada;
            if (entrada && entrada.target && entrada.target.files) archivoReal = entrada.target.files[0];
            else if (entrada && (entrada instanceof FileList || Array.isArray(entrada) || entrada.length)) archivoReal = entrada[0];
            else if (entrada && entrada.dataTransfer && entrada.dataTransfer.files) archivoReal = entrada.dataTransfer.files[0];

            if (!(archivoReal instanceof Blob) && !(archivoReal instanceof File)) return;

            const lector = new FileReader();
            lector.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    if (!validarDimensionesImagen(this.width, this.height, false)) return;
                    montarEnCroppie(e.target.result);
                };
                img.src = e.target.result;
            };
            lector.readAsDataURL(archivoReal);
        };

        if (archivoInicial) {
            procesarEntrada(archivoInicial);
        } else {
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

    inicializarLogoEmpresa: function (selector, archivoInicial = null, opcionesExtra = {}) {
        const config = $.extend({}, this.presets.logoEmpresa, opcionesExtra);
        this.inicializar(selector, archivoInicial, config);
    },

    inicializarPerfilUsuario: function (selector, archivoInicial = null, opcionesExtra = {}) {
        const config = $.extend({}, this.presets.perfilUsuario, opcionesExtra);
        this.inicializar(selector, archivoInicial, config);
    },

    _inyectarBotonGuardar: function (config) {
        const $contenedorBtn = $(config.contenedorBotonGuardar);
        if (!$contenedorBtn.length) return;

        $contenedorBtn.html(`
            <a class="h-40 min-w-100 flex justify-center items-center rounded-md btn btn-primary" id="${config.botonGuardarId}">
                <div class="h-p-100 flex justify-center items-center">
                    <span>Guardar</span>
                </div>
            </a>
        `);

        if (typeof Evento_Guardar_Imagen === 'function') {
            Evento_Guardar_Imagen();
        }
    },

    _vincularDragDropViewport: function ($contenedor, callbackProcesar) {
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

    destruir: function (selector) {
        const $padre = $(selector);
        if (!$padre.length) return;
        const instancia = $padre.data('croppieInstance');
        if (instancia && typeof instancia.destroy === 'function') {
            instancia.destroy();
        }
        $padre.removeData('croppieInstance').removeClass('editor-container').empty();
    }
};