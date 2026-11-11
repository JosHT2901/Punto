$(document).ready(function(e)
{
    $('#contenedor-pin').html(PinValidador.renderizar(4, false));
    $('#contenedor-pin-confirmacion').html(PinValidador.renderizar(4, true));

    window.PinValidador.init({
        containerSelector: '#reglas-container-pin', // Donde se pintan los checks (incluyendo el de coincidencia)
        containerConfirmarSelector: '#contenedor-pin-confirmacion', // Selector de los inputs de confirmación
        onCambio: function (esValido, pin, pinConf) {
            // Se habilita el botón solo si pasa todas las reglas y los PINs coinciden
            $('#btn-continuar').prop('disabled', !esValido);
        }
    });

    $(document).off('change.togglePass', '#input-check-pin').on('change.togglePass', '#input-check-pin', function () {
        // 1. Determinar si mostrar u ocultar basado en el estado del checkbox
        const mostrar = $(this).is(':checked');
        const nuevoTipo = mostrar ? 'text' : 'password';

        // 2. Seleccionar todos los inputs del PIN (tanto el principal como el de confirmación)
        const $inputs = $(".input-pin");

        // 3. Aplicar el cambio de tipo usando .prop()
        if ($inputs.length) {
            $inputs.prop('type', nuevoTipo);
        }

        // 4. Mantener el foco en el primer input del PIN para mejorar la experiencia de usuario (UX)
        $(".input-pin").not(".input-pin-confirmar").first().focus();
    });

    $("#boton-confirmar-reset").off('click').on('click', function(e) {
        e.preventDefault();
    
        // 1. Obtener los valores usando tu servicio PinValidador
        const pin = window.PinValidador ? window.PinValidador.obtener() : '';
        const pinConfirmar = window.PinValidador ? window.PinValidador.obtenerConfirmacion() : '';
    
        // 2. Validaciones específicas para el PIN de 4 dígitos
        if (pin.length !== 4) {
            MostrarAlerta("El PIN debe tener exactamente 4 dígitos.", 250, true);
            return;
        }
    
        // Validar números consecutivos (ej. 1234, 4321)
        const ascendentes = "012345678901234567890123456789";
        const descendentes = "987654321098765432109876543210";
        let esConsecutivo = false;
        for (let i = 0; i <= ascendentes.length - 4; i++) {
            if (pin === ascendentes.substr(i, 4) || pin === descendentes.substr(i, 4)) {
                esConsecutivo = true;
                break;
            }
        }
        if (esConsecutivo) {
            MostrarAlerta("El PIN no debe tener números consecutivos (ej. 1234).", 250, true);
            return;
        }
    
        // Validar dígitos repetidos (ej. 0000, 1111)
        const primerCaracter = pin[0];
        const esRepetido = pin.split('').every(char => char === primerCaracter);
        if (esRepetido) {
            MostrarAlerta("El PIN no debe tener todos los dígitos iguales (ej. 0000).", 250, true);
            return;
        }
    
        // Validar coincidencia
        if (pin !== pinConfirmar) {
            MostrarAlerta("Los PINs ingresados no coinciden.", 250, true);
            return;
        }
    
        // 3. Preparar el payload y enviar mediante AjaxService
        const payload = {
            accion: 'actualizar_pin_reset', // O 'actualizar_password_reset' según tu controlador
            pin: pin,
            confirmar: pinConfirmar
        };
    
        Guardar_Reset_Pin(payload);
    });
})