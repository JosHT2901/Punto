window.TooltipAPI = (function($) {
    // Creamos el elemento tooltip y lo aseguramos oculto por defecto vía clase CSS o estilos base
    const $tooltip = $('<div class="aquo-tooltip"></div>').css({
        position: 'absolute',
        display: 'none',
        zIndex: 99999
    }).appendTo('body');

    function mostrar(target, contenido) {
        if (!target || !contenido) return;

        $tooltip.html(contenido).css({ display: 'block', opacity: 0 });
        
        const $target = $(target);
        const offset = $target.offset();
        const winW = $(window).width();
        const winH = $(window).height();
        const scrollT = $(window).scrollTop();
        
        const targetW = $target.outerWidth();
        const targetH = $target.outerHeight();
        const tooltipW = $tooltip.outerWidth();
        const tooltipH = $tooltip.outerHeight();

        // Posición inicial: Centrado horizontalmente respecto al target y abajo del mismo
        let top = offset.top + targetH + 8;
        let left = offset.left + (targetW / 2) - (tooltipW / 2);

        // 1. Ajuste si se desborda por la derecha de la ventana
        if (left + tooltipW > winW - 10) {
            left = winW - tooltipW - 10;
        }

        // 2. Ajuste si se desborda por la izquierda de la ventana
        if (left < 10) {
            left = 10;
        }

        // 3. Ajuste si se desborda por abajo (lo colocamos arriba del elemento)
        if (top + tooltipH > winH + scrollT) {
            top = offset.top - tooltipH - 8;
        }

        // Aplicamos las coordenadas calculadas y mostramos con transición fluida
        $tooltip.css({
            top: Math.round(top),
            left: Math.round(left),
            opacity: 1
        }).addClass('is-visible');
    }

    function ocultar() {
        $tooltip.removeClass('is-visible').css({ display: 'none', opacity: 0 });
    }

    return { mostrar, ocultar };
})(jQuery);