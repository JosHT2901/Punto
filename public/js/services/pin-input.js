// ==========================================
// SERVICIO: PIN INPUT (AUTORENDERIZABLE Y GESTIÓN DE BOTÓN)
// ==========================================
(function (window, $) {
    const selectorInputs = '.input-pin';

    function initPinInput(config) {
        const { containerSelector, cantidadDigitos = 6, buttonId } = config;
        const $container = $(containerSelector);

        if (!$container.length) return;

        // 1. Dibujar automáticamente los inputs en el contenedor indicado
        let htmlInputs = '';
        for (let i = 0; i < cantidadDigitos; i++) {
            htmlInputs += `<input type="text" name="codigo" class="input-pin input-pin-digito fw-600 text-center fs-8" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off">\n`;
        }
        $container.html(htmlInputs);

        // 2. Función interna para obtener el valor actual del código
        function obtenerCodigo() {
            let codigo = '';
            $container.find(selectorInputs).each(function () {
                codigo += $(this).val() || '';
            });
            return codigo;
        }

        // 3. Evaluar estado y gestionar el botón automáticamente
        function evaluarEstado() {
            const codigoActual = obtenerCodigo();
            const esCompleto = codigoActual.length === cantidadDigitos;

            if (buttonId) {
                const $boton = $(buttonId.startsWith('#') ? buttonId : '#' + buttonId);
                if ($boton.length) {
                    $boton.prop('disabled', !esCompleto);
                    $boton.toggleClass('disabled', !esCompleto);
                }
            }
        }

        // 4. Configurar la navegación, borrado, flechas y avance automático
        const $inputs = $container.find(selectorInputs);

        $inputs.off('keydown.pinInput').on('keydown.pinInput', function (e) {
            const index = $inputs.index(this);

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') return;

            // Borrado con Backspace
            if (e.key === 'Backspace') {
                if ($(this).val() !== '') {
                    $(this).val('');
                } else if (index > 0) {
                    $inputs.eq(index - 1).focus().val('');
                }
                setTimeout(evaluarEstado, 15);
                e.preventDefault();
                return;
            }

            // Navegación con Flecha Izquierda
            if (e.key === 'ArrowLeft' && index > 0) {
                $inputs.eq(index - 1).focus();
                e.preventDefault();
                return;
            }

            // Navegación con Flecha Derecha
            if (e.key === 'ArrowRight' && index < $inputs.length - 1) {
                $inputs.eq(index + 1).focus();
                e.preventDefault();
                return;
            }

            // Permitir solo números
            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // Avance automático al escribir un dígito
        $inputs.off('input.pinInput').on('input.pinInput', function () {
            const $this = $(this);
            const index = $inputs.index(this);
            const valorActual = $this.val();
            const valorLimpio = valorActual.replace(/\D/g, '').slice(-1);

            if (valorActual !== valorLimpio) {
                $this.val(valorLimpio);
            }

            if (valorLimpio !== '' && index < $inputs.length - 1) {
                $inputs.eq(index + 1).focus();
            }

            setTimeout(evaluarEstado, 15);
        });

        // Soporte para pegar código completo (Ctrl + V)
        $inputs.off('paste.pinInput').on('paste.pinInput', function (e) {
            e.preventDefault();
            const texto = (e.originalEvent.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            if (!texto) return;

            $inputs.val('');
            for (let i = 0; i < Math.min(texto.length, $inputs.length); i++) {
                $inputs.eq(i).val(texto[i]);
            }
            $inputs.eq(Math.min(texto.length, $inputs.length) - 1).focus();
            setTimeout(evaluarEstado, 15);
        });

        evaluarEstado();
    }

    window.PinInput = {
        init: initPinInput,
        obtener: function() {
            let codigo = '';
            $(selectorInputs).each(function () {
                codigo += $(this).val() || '';
            });
            return codigo;
        }
    };

})(window, jQuery);