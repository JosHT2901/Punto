const longitud_password=10
$(document).ready(function(e)
{
    ValidadorUI.init({
        inputSelector: '#nueva-password',
        extraInputSelector: '#confirmar-password', // <-- NUEVO: Escucha también este input
        containerSelector: '#reglas-container',
        reglas: [
            {
                id: 'length',
                label: 'Mínimo 10 caracteres',
                test: val => val.length >= longitud_password
            },
            {
                id: 'uppercase',
                label: 'Al menos una letra mayúscula',
                test: val => /[A-Z]/.test(val)
            },
            {
                id: 'lowercase',
                label: 'Al menos una letra minúscula',
                test: val => /[a-z]/.test(val)
            },
            {
                id: 'numbers',
                label: 'Al menos un número',
                test: val => /\d/.test(val)
            },
            {
                id: 'special',
                label: 'Al menos un carácter especial (ej. @$!%*?&)',
                test: val => /[$@$!%*?&#._-]/.test(val)
            },
            {
                id: 'match',
                label: 'Las contraseñas deben coincidir',
                test: val => {
                    const confirmVal = $('#confirmar-password').val();
                    return val.length > 0 && val === confirmVal;
                }
            }
        ]
    });

    $(document).off('change.togglePass', '#input-check-password').on('change.togglePass', '#input-check-password', function () {
        // 1. Determinar si mostrar u ocultar basado en el estado del checkbox
        const mostrar = $(this).is(':checked');
        const nuevoTipo = mostrar ? 'text' : 'password';

        // 2. Seleccionar ambos inputs (password y confirmar password)
        const $inputs = $("#nueva-password, #confirmar-password");

        // 3. Aplicar el cambio de tipo usando .prop()
        if ($inputs.length) {
            $inputs.prop('type', nuevoTipo);
        }

        // 4. Mantener el foco en el input principal para mejorar la experiencia de usuario (UX)
        $("#nueva-password").focus();
    });

    $("#boton-confirmar-reset").off('click').on('click', function(e) {
        e.preventDefault();

        const password = $("#nueva-password").val() || '';
        const confirmarPassword = $("#confirmar-password").val() || '';

        // 1. Ejecutar las mismas validaciones de seguridad
        const esLargoValido = password.length >= longitud_password;
        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneMinuscula = /[a-z]/.test(password);
        const tieneNumero = /\d/.test(password);
        const tieneEspecial = /[$@$!%*?&#._-]/.test(password);
        const coinciden = password === confirmarPassword && password.length > 0;

        // 2. Comprobar si alguna regla falla
        if (!esLargoValido || !tieneMayuscula || !tieneMinuscula || !tieneNumero || !tieneEspecial || !coinciden) {
            MostrarAlerta("La contraseña no cumple con todos los requisitos de seguridad o no coincide.", 250, true);
            $("#nueva-password").focus();
            return;
        }

        const payload = {
            accion: 'actualizar_password_reset_usuario_actual',
            password: password,
            confirmar: confirmarPassword
        };

        Guardar_Reset_Password_Usuario(payload);
    });

    
})