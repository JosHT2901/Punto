/* =============================================
    SERVICIO: BUSCADOR UNIVERSAL (Independiente)
============================================= */
window.BuscadorUniversal = (function ($) {
    
    class BuscadorUniversalManager {
        constructor(config) {
            this.inputId     = config.inputId;
            this.btnResetId  = config.btnResetId;
            this.fuente      = config.datos || []; 
            this.render      = config.render; 
            this.onSearch    = config.onSearch || null; 
            
            // Filtro personalizado o por defecto (busca en todos los campos)
            this.filtroFn    = config.filtroFn || ((item, term) => 
                Object.values(item).some(val => String(val).toLowerCase().includes(term))
            );
            
            this.timer = null;
            this.init();
        }

        setDatos(nuevosDatos) {
            this.fuente = nuevosDatos;
        }

        init() {
            const $input =$(this.inputId);
            const $btn   =$(this.btnResetId);

            if ($input.length === 0) {
                console.warn(`BuscadorUniversal: No se encontró el elemento input con selector "${this.inputId}"`);
                return;
            }

            const ejecutarBusqueda = (termino) => {
                const terminoMin = termino.toLowerCase();
                
                if (this.fuente && this.fuente.length > 0) {
                    const filtrados = this.fuente.filter(item => this.filtroFn(item, terminoMin));
                    if (typeof this.render === 'function') {
                        this.render(filtrados, 'local', terminoMin);
                    }
                } 
                
                if (typeof this.onSearch === 'function') {
                    this.onSearch(terminoMin);
                }
            };

            // Evento de tecleo con retraso (debounce) de 300ms
            $input.on('input', (e) => {
                const termino = $(e.target).val().trim();
                
                if ($btn.length) {
                    termino.length > 0 ? $btn.show() :$btn.hide();
                }
                
                clearTimeout(this.timer);
                this.timer = setTimeout(() => ejecutarBusqueda(termino), 300);
            });

            // Evento para disparar inmediatamente al presionar Enter
            $input.on('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(this.timer);
                    ejecutarBusqueda($(e.target).val().trim());
                }
            });

            // Botón de limpieza (Reset)
            if ($btn.length) {
                // Estado inicial del botón según si ya trae texto
                if ($input.val().trim().length > 0) {$btn.show();
                } else {
                    $btn.hide();
                }

                $btn.on('click', () => {$input.val('').trigger('input');
                    $btn.hide();$input.focus();
                });
            }
        }
    }

    // Exponemos una función de fábrica o la clase directamente
    return {
        crear: (config) => new BuscadorUniversalManager(config)
    };

})(jQuery);