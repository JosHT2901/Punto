/**
 * API Auto-Ejecutable para estructuras de Cabecera -> Panel (Universal / Reutilizable)
 * Compatible con nomenclaturas .js-* y .acordeon-*
 */
function InicializarAcordeonUniversal() {
    // 1. Manejo del header y botones de toggle (Acordeón)
    $(document).off('click.acordeonUniversal').on('click.acordeonUniversal', '.js-header-toggle, .js-btn-toggle, .acordeon-header', function(e) {
        e.stopPropagation();

        // Si el usuario hace clic en un elemento interactivo interno (inputs, selects, enlaces o botones ajenos), ignoramos el acordeón
        const $target = $(e.target);
        if ($target.closest('input, select, textarea, a, button').not('.js-btn-toggle, .js-header-toggle, .acordeon-header').length > 0) {
            return;
        }

        // Buscamos de manera segura la tarjeta contenedora principal
        const $card = $(this).closest('.card, .acordeon-item');
        const $targetCard = $card.length ? $card : $(this).parent();

        const $panel = $targetCard.find('.js-panel-toggle, .acordeon-panel').first();
        const $icono = $targetCard.find('.js-icon-toggle, .js-btn-toggle i, .acordeon-icon, i[class*="caret"], i[class*="flecha"]').first();

        if ($panel.length) {
            // .stop(true, true) previene efectos visuales colaterales por clics rápidos encadenados
            $panel.stop(true, true).slideToggle(200);
            $icono.toggleClass('is-rotated');
        }
    });

    // 2. Protección de clics en checkboxes dentro del acordeón
    $(document).off('click.acordeonCheckbox').on('click.acordeonCheckbox', 'input[type="checkbox"]', function(e) {
        e.stopPropagation();
    });
    
    // 3. Protección de etiquetas (LABEL) asociadas para evitar conflictos de propagación
    $(document).off('click.acordeonLabel').on('click.acordeonLabel', 'label', function(e) {
        const $associatedInput = $(this).find('input[type="checkbox"]');
        const targetAttr = $(this).attr('for');
        
        if ($associatedInput.length > 0 || (targetAttr && $('#' + targetAttr).is('input[type="checkbox"]'))) {
            e.stopPropagation();
        }
    });
}