$(document).off('datosListos.imap').on('datosListos.imap', function (e, imapData) {
    const config = imapData || window.configuracion || {};

    // 1. Insertar el Custom Select para IMAP
    InsertarCustomSelect({
        contenedor: '#imap-contenedor-select-seguridad',
        id: 'imap-select-seguridad',
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
            console.log("Seguridad IMAP seleccionada:", valorSeguridad);
        }
    });

    // 2. Establecer el valor utilizando la API nativa de tu motor
    if (window.CustomSelect && typeof window.CustomSelect.setValue === 'function') {
        window.CustomSelect.setValue('#imap-select-seguridad', config.secure || 'tls', false);
    }

    // 3. Rellenar los inputs restantes de IMAP (sin from_name)
    $('#imap-input-host').val(config.host || '');
    $('#imap-input-port').val(config.port || 993);
    $('#imap-input-username').val(config.username || '');
    $('#imap-input-password').val(config.password || '');

    InputService.maxLength('.input-100', 100);
    InputService.soloNumeros('#imap-input-port', 'Ingresa el número del puerto', 'left');
    InputService.maxLength('#imap-input-port', 5);
    InputService.correo('#imap-input-username');

    $(document).on('click', '#imap-boton-ver-password', function (e) {
        e.preventDefault();

        const $inputPassword = $('#imap-input-password');
        const $icono = $(this).find('i');

        if ($inputPassword.attr('type') === 'password') {
            $inputPassword.attr('type', 'text');
            $icono.removeClass('vf-ic_fluent_eye_24_filled').addClass('vf-ic_fluent_eye_off_24_filled');
            $(this).attr('title', 'Ocultar contraseña');
        } else {
            $inputPassword.attr('type', 'password');
            $icono.removeClass('vf-ic_fluent_eye_off_24_filled').addClass('vf-ic_fluent_eye_24_filled');
            $(this).attr('title', 'Ver contraseña');
        }
    });

    $(document).on('click', '#imap-boton-guardar', async function (e) {
        e.preventDefault();

        // 1. Recopilar los valores del formulario IMAP
        const host = $('#imap-input-host').val().trim();
        const port = $('#imap-input-port').val().trim();
        const secure = CustomSelect.getValue('#imap-select-seguridad');
        const username = $('#imap-input-username').val().trim();
        const password = $('#imap-input-password').val().trim();

        // 2. Validaciones básicas en el frontend
        if (!host) {
            MostrarAlerta('El servidor (Host) IMAP es obligatorio.', 250, false);
            $('#imap-input-host').focus();
            return;
        }

        if (!port || isNaN(port) || port <= 0) {
            MostrarAlerta('Por favor, ingresa un puerto IMAP válido.', 250, false);
            $('#imap-input-port').focus();
            return;
        }

        if (!ValidacionService.validarCorreo(username)) {
            MostrarAlerta('Ingresa un correo electrónico de usuario válido.', 250, false);
            $('#imap-input-username').focus();
            return;
        }

        if (!password) {
            MostrarAlerta('La contraseña o token es obligatoria.', 250, false);
            $('#imap-input-password').focus();
            return;
        }

        // 3. Preparar el payload para enviarlo al backend
        const payload = {
            accion: 'guardar_ajustes_imap',
            host: host,
            port: parseInt(port),
            secure: secure,
            username: username,
            password: password
        };

        Guardar_Configuracion_IMAP(payload);
    });
});