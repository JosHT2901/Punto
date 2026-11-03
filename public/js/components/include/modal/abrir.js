/**
 * Modal Master API - Con Transición Secuencial, control de dimensiones y soporte exclusivo para Carga
 */
const ModalAPI = {
    _onClose: null,
    _config: {},
    _esModalCargando: false, // 🌟 Rastrea si el modal actualmente abierto es de tipo carga

    get $overlay() { return $('#modal-overlay'); },
    get $modalContent() { return $('#modal-content'); },
    get $tituloContainer() { return $('#modal-titulo-container'); },
    get $tituloTexto() { return $('#modal-titulo-texto'); },
    get $bodyContent() { return $('#modal-body-content'); },
    get $btnCerrar() { return $('#btn-cerrar-modal'); },

    estaAbierto() {
        return !this.$overlay.hasClass('d-none');
    },

    /**
     * Abre un modal. Si ya hay uno abierto, maneja la apertura de forma inteligente.
     */
    abrir(p = {}) {
        const esNuevoCargando = p.esCargando === true;

        // Si ya hay un modal abierto y el nuevo NO es de carga, o viceversa, gestionamos la transición
        if (this.estaAbierto()) {
            // Si el modal actual es de carga y abren otro normal, o si se superponen:
            this.cerrar(() => {
                this._ejecutarApertura(p);
            });
        } else {
            this._ejecutarApertura(p);
        }
    },

    // Método interno para renderizar el modal
    _ejecutarApertura(p) {
        this._esModalCargando = p.esCargando === true; // Guardamos el estado

        this._config = {
            titulo: p.titulo || '',
            contenido: p.contenido || '',
            cerrarBtn: p.cerrarBtn ?? true,
            overlayClick: p.overlayClick ?? true,
            transparencia: p.transparencia ?? true, 
            altura: p.altura || 'auto',            
            anchoMax: p.anchoMax || '400px',        
            onClose: typeof p.onClose === 'function' ? p.onClose : null
        };

        this._onClose = this._config.onClose;

        // Aplicar dimensiones y ancho máximo directamente a #modal-content
        this.$modalContent.css({
            'max-width': this._config.anchoMax,
            'width': '100%',
            'height': typeof this._config.altura === 'number' ? `${this._config.altura}px` : this._config.altura
        });

        this.$bodyContent.html(this._config.contenido);

        // Gestionar Título y Botón Cerrar
        this.$tituloTexto.text(this._config.titulo);
        this.$tituloContainer.toggleClass('d-none', !this._config.titulo);
        this.$btnCerrar.toggleClass('d-none', !this._config.cerrarBtn);

        // Aplicar Transparencia
        if (this._config.transparencia) {
            this.$overlay.css('background-color', 'rgba(0, 0, 0, 0.6)'); 
        } else {
            this.$overlay.css('background-color', 'white'); 
        }

        // Mostrar modal con animación fluida
        $('body').css('overflow', 'hidden');
        this.$overlay.removeClass('d-none');
        setTimeout(() => this.$overlay.css('opacity', '1'), 10);

        this._bindEvents();
    },

    /**
     * Cierra específicamente el modal si actualmente está activo como pantalla de carga.
     */
    cerrarCargando(callback = null) {
        if (this._esModalCargando) {
            this.cerrar(callback);
        } else {
            // Si no era un modal de carga el que estaba activo, evitamos cerrarlo por error
            if (callback) callback();
        }
    },

    /**
     * Cierra el modal actual. 
     * @param {Function} [callback] Función opcional que se ejecuta exactamente al terminar de cerrar.
     */
    cerrar(callback = null) {
        if (!this.estaAbierto()) {
            this._esModalCargando = false;
            if (callback) callback();
            return;
        }

        this.$overlay.css('opacity', '0');

        setTimeout(() => {
            this.$overlay.addClass('d-none');
            $('body').css('overflow', '');
            this.$bodyContent.empty();
            $(document).off('keydown.modal');

            // Limpiar estilos de fondo y dimensiones aplicadas por JS en el contenido
            this.$overlay.css('background-color', '');
            this.$modalContent.css({ 'max-width': '', 'height': '', 'width': '' });

            // Reiniciar estado de carga
            this._esModalCargando = false;

            // Ejecutar callback de cierre centralizado
            if (this._onClose) {
                this._onClose();
                this._onClose = null;
            }

            if (typeof callback === 'function') {
                callback();
            }
        }, 100); 
    },

    _bindEvents() {
        // Cierre por botón
        this.$btnCerrar.off('click').on('click', (e) => {
            e.stopPropagation();
            if (this._config.cerrarBtn) this.cerrar();
        });

        // Cierre por clic en el overlay (fondo oscuro)
        this.$overlay.off('click').on('click', (e) => {
            if (e.target === this.$overlay[0] && this._config.overlayClick && this._config.cerrarBtn) {
                this.cerrar();
            }
        });

        // Cierre por tecla Escape
        $(document).off('keydown.modal').on('keydown.modal', (e) => {
            if (e.key === 'Escape' && this.estaAbierto() && this._config.cerrarBtn) {
                this.cerrar();
            }
        });
    }
};