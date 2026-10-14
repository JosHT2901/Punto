function InicializarWizardAcordeon(validarPasoCallback) {
    
    function cambiarPasoAcordeon($btn, esSiguiente) {
        const $wizard = $btn.closest('.js-wizard-container');
        if (!$wizard.length) return;
    
        const $currentCard = $btn.closest('.js-acordeon-container');

        // Si intenta avanzar, evaluamos primero el callback de validación
        if (esSiguiente && typeof validarPasoCallback === 'function') {
            const esValido = validarPasoCallback($currentCard, $btn);
            if (esValido === false) {
                return; // ⛔️ Frena aquí: no avanza ni cierra si la validación falla
            }
        }

        const $steps = $wizard.find('.js-acordeon-container');
        const currentIndex = $steps.index($currentCard);
        
        const targetIndex = esSiguiente ? currentIndex + 1 : currentIndex - 1;
    
        if (targetIndex >= 0 && targetIndex < $steps.length) {
            const $targetCard = $steps.eq(targetIndex);
    
            const $currentPanel = $currentCard.find('.js-panel-toggle').first();
            const $currentIcon = $currentCard.find('.js-icon-toggle').first();
    
            const $targetPanel = $targetCard.find('.js-panel-toggle').first();
            const $targetIcon = $targetCard.find('.js-icon-toggle').first();
    
            // 1. Cerramos el panel actual
            if ($currentPanel.length) {
                $currentPanel.stop(true, true).slideUp(200);
                $currentIcon.removeClass('is-rotated');
            }
    
            // 2. Abrimos el panel de destino y hacemos el scroll CUANDO TERMINE la animación
            if ($targetPanel.length) {
                $targetPanel.stop(true, true).slideDown(200, function() {
                    // Buscar el contenedor con scroll (modal, wrapper, etc.)
                    const $contenedorScroll = $targetCard.closest('.js-wizard-container, .modal-body, .content-wrapper')
                        .filter(function() {
                            const overflow = $(this).css('overflow') + $(this).css('overflow-y');
                            return overflow.includes('hidden') || overflow.includes('auto') || overflow.includes('scroll');
                        }).first();

                    // Margen superior de seguridad para que el título respire
                    const margenSuperior = 70; 
                    let targetTop = 0;

                    if ($contenedorScroll.length) {
                        // Cálculo preciso una vez que el panel ya está abierto e integrado en el DOM
                        targetTop = $targetCard.offset().top - $contenedorScroll.offset().top + $contenedorScroll.scrollTop() - margenSuperior;
                        
                        $contenedorScroll.animate({
                            scrollTop: Math.max(0, targetTop)
                        }, 250);
                    } else {
                        // Fallback por si no encuentra contenedor con overflow explícito
                        const $padre = $targetCard.parent();
                        if ($padre.length) {
                            targetTop = $targetCard[0].offsetTop - margenSuperior;
                            $padre.animate({
                                scrollTop: Math.max(0, targetTop)
                            }, 250);
                        }
                    }
                });
                $targetIcon.addClass('is-rotated');
            }
        }
    }

    // Evento botón SIGUIENTE
    $(document).off('click.wizardNext').on('click.wizardNext', '.js-wizard-next', function(e) {
        e.preventDefault();
        cambiarPasoAcordeon($(this), true);
    });

    // Evento botón ANTERIOR
    $(document).off('click.wizardPrev').on('click.wizardPrev', '.js-wizard-prev', function(e) {
        e.preventDefault();
        cambiarPasoAcordeon($(this), false);
    });
}