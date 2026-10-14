const ValidadorUI = (function ($) {

    function init(config) {
        const $input =$(config.inputSelector);
        const $container =$(config.containerSelector);

        $container.empty();
        
        config.reglas.forEach(regla => {
            const htmlCheck = `
                <label class="rule-item min-w-100 flex justify-start items-center gap-2 mb-2 px-3 rounded-md flex-shrink-0 fw-600" style="pointer-events: none;">
                    <input type="checkbox" class="checkbox-round" data-rule-id="${regla.id}">
                    <span class="fs-3">${regla.label}</span>
                </label>
            `;
            $container.append(htmlCheck);
        });

        function evaluar() {
            const texto = $input.val() || '';
            let todasCumplidas = true;

            config.reglas.forEach(regla => {
                const cumplida = regla.test(texto);
                const $check =$container.find(`input[data-rule-id="${regla.id}"]`);

                $check.prop('checked', cumplida);

                if (cumplida) {
                    $check.closest('.rule-item').css('color', 'var(--brand-500, green)');
                } else {
                    todasCumplidas = false;
                    $check.closest('.rule-item').css('color', 'inherit');
                }
            });

            if (typeof config.onCambio === 'function') {
                config.onCambio(todasCumplidas);
            }
        }

        $input.off('input.validadorUI').on('input.validadorUI', evaluar);
        evaluar();
    }

    return {
        init
    };

})(jQuery);