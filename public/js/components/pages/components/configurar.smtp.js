$(document).off('datosListos.smtp').on('datosListos.smtp', function (e, smtpData) {
    const config = smtpData || window.configuracion || {};

    // 1. Insertar el Custom Select (sin modificar tu función original)
    InsertarCustomSelect({
        contenedor: '#contenedor-select-seguridad',
        id: 'select-seguridad',
        placeholder: 'Selecciona el nivel de seguridad',
        opciones: [{
                value: 'tls',
                text: 'TLS (STARTTLS)'
            },
            {
                value: 'ssl',
                text: 'SSL'
            },
            {
                value: 'none',
                text: 'Ninguna'
            }
        ],
        buscador: false,
        onChange: function (valorSeguridad) {
            console.log("Seguridad seleccionada:", valorSeguridad);
        }
    });

    // 2. Establecer el valor utilizando la API nativa de tu motor (CustomSelect.setValue)
    if (window.CustomSelect && typeof window.CustomSelect.setValue === 'function') {
        window.CustomSelect.setValue('#select-seguridad', config.secure || 'tls', false);
    }

    // 3. Rellenar los inputs restantes
    $('#smtp-input-host').val(config.host || '');
    $('#smtp-input-port').val(config.port || 587);
    $('#smtp-input-username').val(config.username || '');
    $('#smtp-input-password').val(config.password || '');
    $('#smtp-input-from-name').val(config.from_name || '');

    InputService.maxLength('.input-100', 100)
    InputService.soloNumeros('#smtp-input-port', 'Ingresa el número del puerto', 'left')
    InputService.maxLength('#smtp-input-port', 5)
    InputService.correo('#smtp-input-username')

    $(document).on('click', '#smtp-boton-ver-password', function (e) {
        e.preventDefault();

        const $inputPassword = $('#smtp-input-password');
        const $icono = $(this).find('icon'); // O usa .find('i') según tu estructura

        if ($inputPassword.attr('type') === 'password') {
            // Cambiar a texto para mostrar la contraseña
            $inputPassword.attr('type', 'text');

            // Cambiar icono a "ojo tachado" (ocultar)
            $icono.removeClass('vf-ic_fluent_eye_24_filled').addClass('vf-ic_fluent_eye_off_24_filled');
            $(this).attr('title', 'Ocultar contraseña');
        } else {
            // Cambiar a password para ocultar
            $inputPassword.attr('type', 'password');

            // Cambiar icono a "ojo normal" (ver)
            $icono.removeClass('vf-ic_fluent_eye_off_24_filled').addClass('vf-ic_fluent_eye_24_filled');
            $(this).attr('title', 'Ver contraseña');
        }
    });

    $(document).on('click', '#smtp-boton-guardar', async function (e) {
        e.preventDefault();

        // 1. Recopilar los valores del formulario
        const host = $('#smtp-input-host').val().trim();
        const port = $('#smtp-input-port').val().trim();
        const secure = CustomSelect.getValue('#select-seguridad')
        const username = $('#smtp-input-username').val().trim();
        const password = $('#smtp-input-password').val().trim();
        const fromName = $('#smtp-input-from-name').val().trim();

        // 2. Validaciones básicas en el frontend
        if (!host) {
            MostrarAlerta('El servidor (Host) SMTP es obligatorio.', 250, false);
            $('#smtp-input-host').focus();
            return;
        }

        if (!port || isNaN(port) || port <= 0) {
            MostrarAlerta('Por favor, ingresa un puerto SMTP válido.', 250, false);

            $('#smtp-input-port').focus();
            return;
        }

        if (!ValidacionService.validarCorreo(username)) {
            MostrarAlerta('Ingresa un correo electrónico de usuario válido.', 250, false);

            $('#smtp-input-username').focus();
            return;
        }

        if (!password) {
            MostrarAlerta('La contraseña o token es obligatoria.', 250, false);

            $('#smtp-input-password').focus();
            return;
        }

        // 3. Preparar el payload para enviarlo al backend
        const payload = {
            accion: 'guardar_ajustes_smtp', // Asegúrate de que esta acción esté mapeada en tu controlador PHP
            host: host,
            port: parseInt(port),
            secure: secure,
            username: username,
            password: password,
            from_name: fromName || 'Sistema'
        };

        Guardar_Configuracion_SMTP(payload)
    });
});