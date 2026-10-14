/**
 * Servicio de Wizard en Cascada / Acordeón Inteligente
 * Funciona de manera reutilizable sin escribir lógica adicional por formulario.
 */
function InicializarWizardAcordeon() {
    
    // Selectores válidos para enfocar
    const inputsSelector = 'input:not([type="hidden"]):not([disabled]):not([readonly]), input[readonly].input, select:not([disabled])';

    // Función auxiliar ultra robusta para forzar el foco
    function enfocarPrimerInput($card) {
        // Damos tiempo a que el navegador libere el foco del botón y pinte el panel
        setTimeout(() => {
            const $primerInput = $card.find(inputsSelector).first();
            if ($primerInput.length) {
                const el = $primerInput[0];
                if (el && typeof el.focus === 'function') {
                    el.focus();
                    if (typeof el.select === 'function') {
                        el.select();
                    }
                }
            }
        }, 200);
    }

    // Función auxiliar para cambiar de paso de forma fluida
    function cambiarPaso($btn, esSiguiente) {
        $btn.blur(); // Quitamos el foco al botón para que no robe el cursor

        const $wizard = $btn.closest('.js-wizard-container');
        const $currentCard = $btn.closest('.js-acordeon-container');
        
        // Encontrar tarjeta siguiente o anterior
        const $targetCard = esSiguiente 
            ? $currentCard.next('.js-acordeon-container') 
            : $currentCard.prev('.js-acordeon-container');

        if ($targetCard.length) {
            const $currentPanel = $currentCard.find('.js-panel-toggle').first();
            const $currentIcon = $currentCard.find('.js-icon-toggle').first();

            const $targetPanel = $targetCard.find('.js-panel-toggle').first();
            const $targetIcon = $targetCard.find('.js-icon-toggle').first();

            // 1. Cerrar panel actual
            $currentPanel.stop(true, true).slideUp(200);
            $currentIcon.removeClass('is-rotated');

            // 2. Abrir panel de destino y mover el scroll en paralelo de forma limpia
            $targetPanel.stop(true, true).slideDown(250, function() {
                // Callback inmediato al terminar el slideDown
                enfocarPrimerInput($targetCard);
            });

            $targetIcon.addClass('is-rotated');

            // Desplazamiento suave de la página
            $('html, body').stop(true, true).animate({
                scrollTop: $targetCard.offset().top - 20 // Dejamos un pequeño margen superior de respiro
            }, 300);
        }
    }

    // Evento botón SIGUIENTE
    $(document).off('click.wizardNext').on('click.wizardNext', '.js-wizard-next', function(e) {
        e.preventDefault();
        cambiarPaso($(this), true);
    });

    // Evento botón ANTERIOR
    $(document).off('click.wizardPrev').on('click.wizardPrev', '.js-wizard-prev', function(e) {
        e.preventDefault();
        cambiarPaso($(this), false);
    });

    // Autogestión inicial al cargar la página para la primera tarjeta abierta
    $('.js-wizard-container').each(function() {
        const $primeraCardAbierta = $(this).find('.js-acordeon-container').has('.js-panel-toggle').first();
        if ($primeraCardAbierta.length) {
            enfocarPrimerInput($primeraCardAbierta);
        }
    });
}