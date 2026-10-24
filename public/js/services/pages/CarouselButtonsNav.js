// --- Servicio Carrusel de Botones con Navegación Lateral Inteligente (Oculta flechas en los extremos) ---
window.CarouselButtonsNav = (() => {

    const render = ($container, config) => {
        const $target = $($container);
        if ($target.length === 0) return;

        $target.empty();

        // 1. Estilos globales para ocultar barras de scroll y estilizar las flechas
        if ($('#carousel-nav-styles').length === 0) {
            $('head').append(`
                <style id="carousel-nav-styles">
                    .carousel-nav-wrapper { display: flex; align-items: center; width: 100%; position: relative; gap: 8px; box-sizing: border-box; }
                    .carousel-nav-track { display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 10px; align-items: center; width: 100%; scroll-behavior: smooth; -ms-overflow-style: none; scrollbar-width: none; }
                    .carousel-nav-track::-webkit-scrollbar { display: none; }
                </style>
            `);
        }

        // 2. Estructura HTML principal
        const $wrapper = $('<div>', { class: 'carousel-nav-wrapper' }).appendTo($target);
        
        const $leftArrow = $('<button>', { class: 'btn btn-secondary rounded-3xl p-1 w-35 h-35 fs-4 justify-center', html: '<i class="vf-ic_fluent_chevron_left_24_filled"></i>', title: 'Desplazarse a la izquierda' }).appendTo($wrapper);

        const $track = $('<div>', { class: 'carousel-nav-track' }).appendTo($wrapper);

        const $rightArrow = $('<button>', { class: 'btn btn-secondary rounded-3xl p-1 w-35 h-35 fs-4 justify-center', html: '<i class="vf-ic_fluent_chevron_right_24_filled"></i>', title: 'Desplazarse a la derecha' }).appendTo($wrapper);

        // 3. Generar y añadir los botones
        const buttons = Array.isArray(config) ? config : [config];

        buttons.forEach(btn => {
            const text = btn.text;
            const type = btn.type || 'button';
            const cssClass = (btn.class || 'btn btn-primary fw-600') + ' shrink-0';
            const id = btn.id ? `id="${btn.id}"` : '';
            const targetStep = btn.targetStep ? `data-target-step="${btn.targetStep}"` : '';
            const iconHtml = btn.icon ? `<i class="${btn.icon}"></i>` : '';
            const isDisabled = btn.disabled ? 'disabled' : '';
            
            const $button =$(`
                <a type="${type}" class="${cssClass}" style="flex-shrink: 0; white-space: nowrap;" ${targetStep} ${id} ${isDisabled}>
                    ${iconHtml} ${text}
                </a>
            `);

            if (typeof btn.onClick === 'function') {
                $button.on('click', (e) => btn.onClick(e,$button));
            }

            $track.append($button);
        });

        // 4. Lógica inteligente para mostrar/ocultar flechas según los extremos
        const updateArrows = () => {
            const el = $track[0];
            if (!el) return;

            const scrollLeft = el.scrollLeft;
            const scrollWidth = el.scrollWidth;
            const clientWidth = el.clientWidth;

            // Si no hay desbordamiento general, ocultar ambas flechas
            if (scrollWidth <= clientWidth) {
                $leftArrow.hide();$rightArrow.hide();
                return;
            }

            // Ocultar flecha izquierda si estamos al principio (con tolerancia de 2px)
            if (scrollLeft <= 2) {
                $leftArrow.hide();
            } else {
                $leftArrow.css('display', 'flex');
            }

            // Ocultar flecha derecha si hemos llegado al final (Corregido el operador de resta)
            if (scrollLeft + clientWidth >= scrollWidth - 2) {
                $rightArrow.hide();
            } else {
                $rightArrow.css('display', 'flex');
            }
        };

        // Eventos de desplazamiento al hacer clic en las flechas
        $leftArrow.on('click', () => {$track.animate({ scrollLeft: '-=220px' }, 200, updateArrows);
        });

        $rightArrow.on('click', () => {$track.animate({ scrollLeft: '+=220px' }, 200, updateArrows);
        });

        // Actualizar estado de las flechas cuando el usuario hace scroll manual o redimensiona la ventana
        $track.on('scroll', updateArrows);$(window).on('resize.carouselNav', updateArrows);

        // Comprobación inicial tras renderizar el DOM
        setTimeout(updateArrows, 60);
    };

    return {
        render
    };
})();