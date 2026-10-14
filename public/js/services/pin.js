// ==========================================
// SERVICIO UNIFICADO: PIN & VALIDADOR UI
// ==========================================
(function (window, $) {
    const selectorInputs = '.input-pin';
    const selectorConfirmarInputs = '.input-pin-confirmar';

    function initPinValidador(config) {
        const { containerSelector, containerConfirmarSelector, onCambio } = config;
        const $container =$(containerSelector);

        // Contar cuántos dígitos se esperan en el PIN principal analizando el DOM
        const totalDigitosEsperados = $(selectorInputs).not(selectorConfirmarInputs).length || 4;

        // 1. Definir las reglas base del PIN
        const reglasDefinidas = [
            {
                id: 'pin-length',
                label: `Exactamente ${totalDigitosEsperados} dígitos`, // 👈 Dinámico según los inputs generados
                test: val => val.length === totalDigitosEsperados
            },
            {
                id: 'pin-sequential',
                label: 'No debe tener números consecutivos (ej. 1234)',
                test: val => {
                    const longitud = val.length;
                    if (longitud < 4) return false; 
                    const ascendentes = "012345678901234567890123456789";
                    const descendentes = "987654321098765432109876543210";
                    for (let i = 0; i <= ascendentes.length - longitud; i++) {
                        if (val === ascendentes.substr(i, longitud) || val === descendentes.substr(i, longitud)) {
                            return false; 
                        }
                    }
                    return true;
                }
            },
            {
                id: 'pin-repeated',
                label: 'No debe tener todos los dígitos iguales (ej. 0000)',
                test: val => {
                    if (val.length === 0) return false;
                    const primerCaracter = val[0];
                    return !val.split('').every(char => char === primerCaracter);
                }
            }
        ];

        // Si hay contenedor de confirmación, añadimos la regla de coincidencia de forma independiente
        if (containerConfirmarSelector) {
            reglasDefinidas.push({
                id: 'pin-match',
                label: 'Los PINs deben coincidir',
                test: (val, valConfirmar) => {
                    // Solo se valida si ambos tienen la longitud correcta completa
                    return val.length === totalDigitosEsperados && val === valConfirmar;
                }
            });
        }

        // 2. Renderizar visualmente las reglas en el contenedor HTML
        $container.empty();
        reglasDefinidas.forEach(regla => {
            const htmlCheck = `
                <label class="rule-item min-w-100 flex justify-start items-center gap-2 mb-2 px-3 rounded-md flex-shrink-0 fw-600">
                    <input type="checkbox" class="checkbox-round" data-rule-id="${regla.id}" disabled>
                    <span class="fs-3">${regla.label}</span>
                </label>
            `;
            $container.append(htmlCheck);
        });

        // 3. Funciones para obtener los valores por separado
        function obtenerPIN(selector) {
            let pin = '';
            $(selector).each(function () {
                pin += $(this).val() || '';
            });
            return pin;
        }

        // 4. Evaluar estado de las reglas
        function evaluarReglas() {
            const pinPrincipal = obtenerPIN(selectorInputs + ':not(' + selectorConfirmarInputs + ')');
            const pinConfirmar = containerConfirmarSelector ? obtenerPIN(selectorConfirmarInputs) : pinPrincipal;
            let todasCumplidas = true;

            reglasDefinidas.forEach(regla => {
                // Si es la regla de coincidencia, evaluamos con ambos valores; de lo contrario, solo con el principal
                const cumplida = regla.id === 'pin-match' 
                    ? regla.test(pinPrincipal, pinConfirmar) 
                    : regla.test(pinPrincipal);

                const $check =$container.find(`input[data-rule-id="${regla.id}"]`);
                const $ruleItem =$check.closest('.rule-item');

                if ($check.length) {
                    $check.prop('checked', cumplida);$check.get(0).checked = cumplida;
                    $check.trigger('change');
                }

                if (cumplida) {
                    $ruleItem.css('color', 'var(--brand-500, green)').addClass('is-valid').removeClass('is-invalid');
                } else {
                    todasCumplidas = false;
                    $ruleItem.css('color', 'inherit').removeClass('is-valid').addClass('is-invalid');
                }
            });

            if (typeof onCambio === 'function') {
                onCambio(todasCumplidas, pinPrincipal, pinConfirmar);
            }
        }

        // 5. Configurar eventos para ambos conjuntos de inputs de manera idéntica
        function configurarEventos(selectorObjetivo) {
            const $inputs =$(selectorObjetivo);

            $inputs.off('keydown.pinValidador').on('keydown.pinValidador', function (e) {
                const index = $inputs.index(this);

                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') return;

                if (e.key === 'Backspace') {
                    if ($(this).val() !== '') {$(this).val('');
                    } else if (index > 0) {
                        $inputs.eq(index - 1).focus().val('');
                    }
                    setTimeout(evaluarReglas, 15);
                    e.preventDefault();
                    return;
                }

                if (e.key === 'ArrowLeft' && index > 0) {
                    $inputs.eq(index - 1).focus();
                    e.preventDefault();
                    return;
                }

                if (e.key === 'ArrowRight' && index < $inputs.length - 1) {$inputs.eq(index + 1).focus();
                    e.preventDefault();
                    return;
                }

                if (!/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                }
            });

            $inputs.off('input.pinValidador').on('input.pinValidador', function () {
                const $this =$(this);
                const index = $inputs.index(this);
                const valorActual = $this.val();
                const valorLimpio = valorActual.replace(/\D/g, '').slice(-1);

                if (valorActual !== valorLimpio) {
                    $this.val(valorLimpio);
                }

                if (valorLimpio !== '' && index < $inputs.length - 1) {$inputs.eq(index + 1).focus();
                }

                setTimeout(evaluarReglas, 15);
            });

            $inputs.off('paste.pinValidador').on('paste.pinValidador', function (e) {
                e.preventDefault();
                const texto = (e.originalEvent.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (!texto) return;

                $inputs.val('');
                for (let i = 0; i < Math.min(texto.length, $inputs.length); i++) {$inputs.eq(i).val(texto[i]);
                }
                $inputs.eq(Math.min(texto.length, $inputs.length) - 1).focus();
                setTimeout(evaluarReglas, 15);
            });
        }

        // Inicializar eventos para principal y confirmación por separado
        $(selectorInputs).not(selectorConfirmarInputs).length > 0 && configurarEventos(selectorInputs + ':not(' + selectorConfirmarInputs + ')');
        if (containerConfirmarSelector) {
            configurarEventos(selectorConfirmarInputs);
        }

        evaluarReglas();
    }

    function renderizarInputs(cantidadDigitos = 4, esConfirmacion = false) {
        const claseCSS = esConfirmacion ? 'input-pin input-pin-confirmar input-pin-digito' : 'input-pin input-pin-digito';
        let htmlInputs = '';
        for (let i = 0; i < cantidadDigitos; i++) {
            htmlInputs += `<input type="password" name="${esConfirmacion ? 'input-pin-confirmar' : 'input-pin'}" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="${claseCSS}" autocomplete="off">\n`;
        }
        return htmlInputs;
    }

    window.PinValidador = {
        init: initPinValidador,
        obtener: function() {
            let pin = '';
            $(selectorInputs).not(selectorConfirmarInputs).each(function () {
                pin += $(this).val() || '';
            });
            return pin;
        },
        obtenerConfirmacion: function() {
            let pin = '';
            $(selectorConfirmarInputs).each(function () {
                pin += $(this).val() || '';
            });
            return pin;
        },
        renderizar: renderizarInputs,
        toggle: function(mostrar) {
            $(selectorInputs).each(function () {$(this).prop('type', mostrar ? 'text' : 'password');
            });
        }
    };

})(window, jQuery);