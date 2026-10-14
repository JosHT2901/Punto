/**
 * Servicio Global de Navegación por Tecla Enter en Formularios
 * Se registra una sola vez y maneja el flujo de enfoque entre inputs y botones "Siguiente".
 */
const FormNavigationService = (function() {
    
    // Selectores válidos: Permite inputs normales, selects, y permite inputs readonly que formen parte del calendario
    const inputsSelector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), input[readonly].input, select:not([disabled])';

    // Bandera para asegurar que el evento global del teclado se registre UNA sola vez en el DOM
    let eventoGlobalRegistrado = false;

    /**
     * Enfoca automáticamente el primer input válido dentro de un contenedor dado
     */
    function enfocarPrimerInput($contenedor) {
        const $primerInput = $contenedor.find(inputsSelector).filter(':visible').first();
        if ($primerInput.length) {
            // Un pequeño delay opcional (0ms) ayuda a asegurar que el DOM ya esté completamente renderizado o visible si hay animaciones
            setTimeout(() => {
                $primerInput.focus().select();
            }, 0);
        }
    }

    return {
        /**
         * Inicializa el escuchador global del teclado una sola vez
         */
        init() {
            if (eventoGlobalRegistrado) return;

            // Evento global único en el documento usando namespaces limpios
            $(document).on('keydown.formNavigationGlobal', inputsSelector, function (e) {
                if (e.key !== 'Enter' && e.keyCode !== 13) return;

                const $inputActual = $(this);
                
                // Manejo especial si es un input de calendario
                const $wrapperCalendario = $inputActual.closest('.calendario-wrapper');
                if ($wrapperCalendario.length) {
                    const $picker = $wrapperCalendario.find('.calendar-datepicker');
                    
                    if ($picker.length) {
                        // Si el calendario está cerrado, lo abrimos
                        if (!$picker.is(':visible')) {
                            e.preventDefault();
                            $inputActual.trigger('click'); 
                            return;
                        }
                        // Si el calendario está abierto, al presionar Enter lo cerramos para permitir avanzar
                        if ($picker.is(':visible')) {
                            e.preventDefault();
                            $picker.fadeOut(150);
                            // Dejamos que el flujo continúe hacia abajo para pasar al siguiente input
                        }
                    }
                }

                // Buscamos el contenedor activo más cercano que tenga configurada la navegación
                const $contenedor = $inputActual.closest('[data-nav-container]');
                if (!$contenedor.length) return;

                e.preventDefault(); // Evitamos el envío por defecto del formulario

                // 1. Obtenemos todos los inputs focuseables y visibles dentro de este contenedor específico
                const $focusable = $contenedor.find(inputsSelector).filter(':visible');
                const index = $focusable.index(this);

                // 2. Si hay un siguiente input, movemos el foco limpiamente
                if (index > -1 && index + 1 < $focusable.length) {
                    $focusable.eq(index + 1).focus().select();
                } else {
                    // 3. Si ya es el último input, disparamos el clic del botón Siguiente asociado
                    const btnSiguienteSel = $contenedor.attr('data-nav-btn-next');
                    if (btnSiguienteSel) {
                        const $btnSiguiente = $(btnSiguienteSel);
                        if ($btnSiguiente.length && !$btnSiguiente.is(':disabled')) {
                            $btnSiguiente.trigger('click');
                        }
                    }
                }
            });

            eventoGlobalRegistrado = true;
        },

        /**
         * Registra un contenedor o paso para que use la navegación por Enter y aplica autofocus al primer input
         * @param {string} contenedorSelector Selector del bloque (ej. '#paso-1', '.seccion-formulario')
         * @param {string} btnSiguienteSelector Selector del botón siguiente de ese bloque (ej. '#btn-sig-1')
         */
        registrar(contenedorSelector, btnSiguienteSelector) {
            // Aseguramos que el listener global esté activo
            this.init();

            const $contenedor = $(contenedorSelector);
            if (!$contenedor.length) return;

            // Asignamos las referencias en atributos del DOM del contenedor de forma ligera
            $contenedor.attr('data-nav-container', 'true');
            if (btnSiguienteSelector) {
                $contenedor.attr('data-nav-btn-next', btnSiguienteSelector);
            }

            // Aplicamos autofocus automático al primer input de la sección recién registrada
            enfocarPrimerInput($contenedor);
        }
    };
})();