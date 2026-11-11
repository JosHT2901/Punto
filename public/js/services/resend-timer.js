// ==========================================
// SERVICIO: RESEND TIMER (TEMPORIZADOR PERSISTENTE PARA REENVÍO)
// ==========================================
(function (window, $) {

    function initResendTimer(config) {
        const { buttonId, minutos = 3, storageKey = 'resend_timer_expire' } = config;
        const $boton = $(buttonId.startsWith('#') ? buttonId : '#' + buttonId);

        if (!$boton.length) return;

        // Guardar el texto original del botón para restaurarlo después
        const textoOriginal = $boton.attr('data-original-text') || $boton.text();
        if (!$boton.attr('data-original-text')) {
            $boton.attr('data-original-text', textoOriginal);
        }

        function actualizarContador() {
            const tiempoExpiracion = localStorage.getItem(storageKey);
            const ahora = Date.now();

            if (!tiempoExpiracion || tiempoExpiracion <= ahora) {
                // El tiempo expiró o no existe: Habilitar botón
                localStorage.removeItem(storageKey);
                $boton.prop('disabled', false).removeClass('disabled').text(textoOriginal);
                return;
            }

            // Calcular segundos restantes
            const segundosRestantes = Math.ceil((tiempoExpiracion - ahora) / 1000);
            const min = Math.floor(segundosRestantes / 60);
            const seg = segundosRestantes % 60;

            const tiempoFormateado = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
            
            // Deshabilitar y mostrar cuenta regresiva
            $boton.prop('disabled', true).addClass('disabled').text(`Reenviar en (${tiempoFormateado})`);

            // Volver a ejecutar en 1 segundo
            setTimeout(actualizarContador, 1000);
        }

        // Función para iniciar o reiniciar el temporizador (ej. cuando el usuario hace clic en reenviar)
        function iniciarTemporizador() {
            const tiempoFuturo = Date.now() + (minutos * 60 * 1000);
            localStorage.setItem(storageKey, tiempoFuturo);
            actualizarContador();
        }

        // Vincular el evento de clic si no está vinculado
        $boton.off('click.resendTimer').on('click.resendTimer', function (e) {
            e.preventDefault();
            
            if ($boton.prop('disabled')) return;

            // Llamar a la acción de reenvío (puedes disparar un evento personalizado o callback)
            $boton.trigger('enviarCodigo');

            // Iniciar la cuenta regresiva tras hacer clic
            iniciarTemporizador();
        });

        // Verificar el estado inicial al cargar la página
        actualizarContador();
    }

    window.ResendTimer = {
        init: initResendTimer,
        reiniciar: function(buttonId, minutos = 3, storageKey = 'resend_timer_expire') {
            const tiempoFuturo = Date.now() + (minutos * 60 * 1000);
            localStorage.setItem(storageKey, tiempoFuturo);
            initResendTimer({ buttonId, minutos, storageKey });
        }
    };

})(window, jQuery);