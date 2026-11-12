/**
 * Abre el modal de autenticación.
 * @param {Boolean} requiereUsuario - true si pide usuario y contraseña; false si es con sesión activa (permite contraseña o PIN).
 * @param {Function} callbackExitoso - Función a ejecutar si la autenticación es correcta.
 */
function AbrirModalAutenticacion(requiereUsuario = false, callbackExitoso = null) {
    
    const labelCredencial = requiereUsuario ? 'Contraseña' : 'Contraseña o PIN';
    const placeholderCredencial = requiereUsuario ? 'Ingresa tu contraseña' : 'Ingresa tu contraseña o PIN';

    const contenidoFormulario = `
        <div class="w-p-100 overflow-auto flex-column">
            <form class="flex flex-col gap-3" onsubmit="return false;">
                <!-- Campo Usuario (Solo se muestra si requiereUsuario es true) -->
                <div id="auth-contenedor-usuario" class="row-gap-0 flex flex-column ${requiereUsuario ? '' : 'd-none'}">
                    <label class="block fw-500 mb-1 fs-3 fw-600 pl-2">Usuario</label>
                    <input class="w-p-100 h-40" id="auth-input-usuario" placeholder="Ingresa usuario" autocomplete="off">
                    <span id="span-auth-usuario" class="fs-2 pl-2 mt-1 d-none text-danger"></span>
                </div>

                <!-- Campo Credencial (Contraseña o PIN) -->
                <div class="row-gap-0 flex flex-column">
                    <label class="block fw-500 mb-1 fs-3 fw-600 pl-2">${labelCredencial}</label>
                    <div class="flex items-center gap-2">
                        <input type="password" class="w-p-100 h-40" id="auth-input-password" placeholder="${placeholderCredencial}" autocomplete="off">
                        <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 boton-ver-password" id="auth-boton-ver-password" title="Ver credencial">
                            <i class="icon vf-ic_fluent_eye_24_filled fs-6"></i>
                        </a>
                    </div>
                    <span id="span-auth-password" class="fs-3 pl-2 my-3 d-none text-danger fw-600"></span>
                </div>
            </form>
            <div class="w-p-100 flex justify-end mt-4">
                <a class="btn btn-primary fw-600" id="auth-boton-continuar">
                    <span>Continuar</span>
                </a>
            </div>
        </div>
    `;

    // 1. Abrir el modal usando ModalAPI
    ModalAPI.abrir({
        titulo: 'Autenticación Requerida',
        contenido: contenidoFormulario,
        anchoMax: '450px',
        cerrarBtn: true,
        overlayClick: true
    });

    // 2. Enlazar eventos
    _enlazarEventosAutenticacion(requiereUsuario, callbackExitoso);
}

/**
 * Vincula los eventos internos del formulario de autenticación
 */
function _enlazarEventosAutenticacion(requiereUsuario, callbackExitoso) {
    const mostrarErrorSpan = (idSpan, mensaje) => {
        const $span = $(idSpan);
        if (mensaje) {
            $span.text(mensaje).removeClass('d-none');
        } else {
            $span.text('').addClass('d-none');
        }
    };

    // Limpiar errores en tiempo real
    $('#auth-input-usuario').off('input.limpiar').on('input.limpiar', function() {
        mostrarErrorSpan('#span-auth-usuario', '');
    });

    $('#auth-input-password').off('input.limpiar').on('input.limpiar', function() {
        mostrarErrorSpan('#span-auth-password', '');
    });

    // Alternar visibilidad de contraseña/PIN
    $('#auth-boton-ver-password').off('click').on('click', function(e) {
        e.preventDefault();
        const $input = $('#auth-input-password');
        const tipoActual = $input.attr('type');
        
        if (tipoActual === 'password') {
            $input.attr('type', 'text');
            $(this).find('i').removeClass('vf-ic_fluent_eye_24_filled').addClass('vf-ic_fluent_eye_off_24_filled');
        } else {
            $input.attr('type', 'password');
            $(this).find('i').removeClass('vf-ic_fluent_eye_off_24_filled').addClass('vf-ic_fluent_eye_24_filled');
        }
    });

    // Acción del botón Continuar
    $('#auth-boton-continuar').off('click').on('click', async function(e) {
        e.preventDefault();

        mostrarErrorSpan('#span-auth-usuario', '');
        mostrarErrorSpan('#span-auth-password', '');

        const usuarioVal = $('#auth-input-usuario').val() ? $('#auth-input-usuario').val().trim() : '';
        const credencialVal = $('#auth-input-password').val();

        let hayError = false;

        if (requiereUsuario && !usuarioVal) {
            mostrarErrorSpan('#span-auth-usuario', 'Por favor ingresa el usuario.');
            hayError = true;
        }

        if (!credencialVal) {
            mostrarErrorSpan('#span-auth-password', 'Por favor ingresa la credencial.');
            hayError = true;
        }

        if (hayError) {
            return;
        }

        // Construir el payload según el caso
        const payload = {};

        if (requiereUsuario) {
            payload.usuario = usuarioVal;
            payload.password = credencialVal; // Con usuario exige contraseña
        } else {
            // Sin usuario (sesión activa): enviamos la credencial en ambos para que el backend valide si es contraseña o PIN
            payload.password = credencialVal;
            payload.pin = credencialVal;
        }

        try {
            const resultado = await AuthService.verificar(payload);
            console.log(resultado)
            if (!resultado.ok) {
                mostrarErrorSpan('#span-auth-password', resultado.mensaje || 'Credenciales incorrectas.');
                return; // El modal se queda abierto
            }

            ModalAPI.cerrar(() => {
                if (typeof callbackExitoso === 'function') {
                    callbackExitoso(resultado.data);
                }
            });

        } catch (error) {
            console.log(error);
            mostrarErrorSpan('#span-auth-password', error.mensaje || 'Error al conectar con el servidor.');
        }
    });

    // Enviar con Enter
    $('#auth-input-usuario, #auth-input-password').off('keypress').on('keypress', function(e) {
        if (e.which === 13) {
            $('#auth-boton-continuar').click();
        }
    });
}