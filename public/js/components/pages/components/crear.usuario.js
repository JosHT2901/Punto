window.accion='crear'
window.id_usuario = window.id_usuario !== undefined ? window.id_usuario : null;
$(document).ready(function () {


    FormNavigationService.registrar(
        '#form-crear-usuario-basico', // Contenedor de los campos
        '#crear-usuario-informacion-basica-boton-siguiente' // Botón que simulará el clic al llegar al final
    );

    FormNavigationService.registrar(
        '#form-crear-usuario-identidad',
        '#crear-usuario-identidad-boton-siguiente'
    );

    FormNavigationService.registrar(
        '#form-crear-usuario-contacto',
        '#crear-usuario-contacto-boton-siguiente'
    );
    FormNavigationService.registrar(
        '#form-crear-usuario-usuario',
        '#crear-usuario-usuario-boton-siguiente'
    );
    FormNavigationService.registrar(
        '#form-crear-usuario-password',
        '#crear-usuario-password-boton-siguiente'
    );
    FormNavigationService.registrar(
        '#form-crear-usuario-pin',
        '#crear-usuario-pin-boton-siguiente'
    );


    InputService.aMayusculas('.input-mayus');
    InputService.maxLength('.input-50',50);
    InputService.maxLength('.input-100',200);
    InputService.maxLength('#crear-usuario-input-curp', 18)
    InputService.maxLength('#crear-usuario-input-rfc', 13)
    TelefonosUI.init("#crear-usuario-input-telefono");
    AutocompletarCorreo("#crear-usuario-input-correo")


    window.calendario = Calendario.init({
        tipo: 'single',
        contenedor: '#crear-usuario-contenedor-fecha-nacimiento',
        idInput: 'fechaSeleccionada',
        idBtnAnterior: 'btnMesAnterior',
        idBtnSiguiente: 'btnMesSiguiente',
        orientacion: 'horizontal',
        minDate: '2026-01-01',
        maxDate: '2026-12-31',
        onChange: function (fecha) {
            console.log("Fecha seleccionada:", fecha);
        }
    });

    // 2. Inicializar Validador de Contraseñas
    ValidadorUI.init({
        inputSelector: '#crear-usuario-input-password',
        containerSelector: '#reglas-container',
        reglas: [{
                id: 'length',
                label: 'Mínimo 10 caracteres',
                test: val => val.length >= 10
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
                    const confirmVal = $('#crear-usuario-input-confirm-password').val();
                    // Validamos que ambas tengan texto y sean idénticas
                    return val.length > 0 && val === confirmVal;
                }
            }
        ]
    });


    // Opcional: Para asegurarte de que si el usuario escribe primero en la confirmación 
    // o modifica la confirmación, se revalide la regla en tiempo real:
    $(document).on('input', '#crear-usuario-input-confirm-password', function () {
        $('#crear-usuario-input-password').trigger('input');
    });

    // 3. Inicializamos el Wizard con su lógica de validación independiente por paso
    InicializarWizardAcordeon(function ($currentCard, $btn) {

        // Identificamos de qué botón o paso se trata (ejemplo usando el ID del botón actual)
        const btnId = $btn.attr('id');

        // Lógica específica si es el botón de crear usuario / paso 1
        if (btnId === 'crear-usuario-informacion-basica-boton-siguiente') {
            const nombre = $("#crear-usuario-input-nombre").val().trim();
            const apellidoPaterno = $("#crear-usuario-input-apellido-paterno").val().trim();
            const apellidoMaterno = $("#crear-usuario-input-apellido-materno").val().trim();
            const fecha_nacimiento = window.calendario.getValor()
            if (!nombre) {
                // 💡 Corregido: Se pasa solo el texto según la nueva API simplificada de MostrarAlerta
                MostrarAlerta('Ingresa el nombre');
                return false; // ⛔️ Detiene el avance del acordeón
            }

            if (!apellidoPaterno) {
                MostrarAlerta('Ingresa el apellido paterno')
                return false;
            }

            if (!apellidoMaterno) {
                MostrarAlerta('Ingresa el apellido materno')
                return false;
            }

            if (!fecha_nacimiento) {
                // 💡 Corregido: Se pasa solo el texto según la nueva API simplificada de MostrarAlerta
                MostrarAlerta('Selecciona una fecha de nacimiento');
                return false; // ⛔️ Detiene el avance del acordeón
            }
            $("#crear-usuario-input-curp").focus()
        }

        if (btnId === 'crear-usuario-identidad-boton-siguiente') {
            const curp = $("#crear-usuario-input-curp").val().trim().toUpperCase();
            const rfc = $("#crear-usuario-input-rfc").val().trim().toUpperCase();

            // 1. Validaciones de CURP
            if (!curp) {
                MostrarAlerta('Ingresa un C.U.R.P.');
                return false; // ⛔️ Detiene el avance del acordeón
            }
            if (!ValidacionService.validarCURP(curp)) {
                MostrarAlerta('Ingresa un C.U.R.P. válido');
                return false; // ⛔️ Detiene el avance del acordeón
            }

            // Validación de duplicado en CURP
            let curpExiste = window.usuarios && window.usuarios.some(u => u.curp && u.curp.toUpperCase() === curp);
            if (curpExiste) {
                MostrarAlerta('Este C.U.R.P. ya se encuentra registrado en el sistema');
                return false; // ⛔️ Detiene el avance del acordeón
            }

            // 2. Validaciones de RFC
            if (!rfc) {
                MostrarAlerta('Ingresa un R.F.C.');
                return false; // ⛔️ Detiene el avance del acordeón
            }
            if (!ValidacionService.validarRFC(rfc)) {
                MostrarAlerta('Ingresa un R.F.C. válido');
                return false; // ⛔️ Detiene el avance del acordeón
            }

            // Validación de duplicado en RFC
            let rfcExiste = window.usuarios && window.usuarios.some(u => u.rfc && u.rfc.toUpperCase() === rfc);
            if (rfcExiste) {
                MostrarAlerta('Este R.F.C. ya se encuentra registrado en el sistema');
                return false; // ⛔️ Detiene el avance del acordeón
            }
        }

        if (btnId === 'crear-usuario-contacto-boton-siguiente') {
            const selectorTel = "#crear-usuario-input-telefono";
            const telefonoLimpio = TelefonosUI.getValor(selectorTel);
         
            if (!TelefonosUI.esValido(selectorTel)) {
                return MostrarAlerta("El número de teléfono no es válido para el país seleccionado.", 200, false);
            }
            console.log(window.usuarios);
        
            // Comparamos directamente el teléfono limpio con el existente en el array global
            let telefonoExiste = Array.isArray(window.usuarios) && window.usuarios.some(u => {
                if (!u.telefono) return false;
                return u.telefono === telefonoLimpio;
            });
        
            if (telefonoExiste) {
                MostrarAlerta('Este número de teléfono ya se encuentra registrado');
                return false;
            }
        
            // 4. Validaciones de Correo
            const correo = $("#crear-usuario-input-correo").val().trim();
            if (!correo) {
                MostrarAlerta('Ingresa un correo electrónico');
                return false;
            }
            if (!ValidacionService.validarCorreo(correo)) {
                MostrarAlerta('Ingresa un correo electrónico válido');
                return false;
            }
        
            let correoExiste = Array.isArray(window.usuarios) && window.usuarios.some(u => u.correo && u.correo.trim().toLowerCase() === correo.toLowerCase());
            if (correoExiste) {
                MostrarAlerta('Este correo electrónico ya se encuentra registrado');
                return false;
            }
        }

        if (btnId === 'crear-usuario-usuario-boton-siguiente') {
            const usuario = $("#crear-usuario-input-usuario").val().trim();

            if (!usuario) {
                MostrarAlerta('Ingresa un nombre de usuario');
                return false;
            }
        }

        if (btnId === 'crear-usuario-password-boton-siguiente') {
            const password = $("#crear-usuario-input-password").val() || '';
            const confirmarPassword = $("#crear-usuario-input-confirm-password").val() || '';

            // 1. Ejecutar las mismas validaciones de seguridad
            const esLargoValido = password.length >= 10;
            const tieneMayuscula = /[A-Z]/.test(password);
            const tieneMinuscula = /[a-z]/.test(password);
            const tieneNumero = /\d/.test(password);
            const tieneEspecial = /[$@$!%*?&#._-]/.test(password);
            const coinciden = password === confirmarPassword && password.length > 0;

            // 2. Comprobar si alguna regla falla
            if (!esLargoValido || !tieneMayuscula || !tieneMinuscula || !tieneNumero || !tieneEspecial || !coinciden) {
                // Puedes lanzar una alerta visual o un console.warn
                MostrarAlerta("La contraseña no cumple con todos los requisitos de seguridad o no coincide.");

                // Opcional: enfocar el input con error
                $("#crear-usuario-input-password").focus();
                return; // Detiene el flujo de la siguiente pestaña/paso
            }

        }

        if (btnId === 'crear-usuario-pin-boton-siguiente') {
            // 1. Obtener los valores actuales de ambos campos usando los métodos del servicio
            const pinPrincipal = window.PinValidador.obtener();
            const pinConfirmacion = window.PinValidador.obtenerConfirmacion();
            const totalEsperado = $('.input-pin').not('.input-pin-confirmar').length || 4;
        
            // 2. Validaciones previas de seguridad antes de avanzar
            if (pinPrincipal.length !== totalEsperado) {
                // Alerta o notificación de que falta completar el PIN principal
                MostrarAlerta('El PIN principal está incompleto.');
                return;
            }
        
            if (pinConfirmacion.length !== totalEsperado) {
                // Alerta o notificación de que falta completar la confirmación
                MostrarAlerta('El PIN de confirmación está incompleto.');
                return;
            }
        
            if (pinPrincipal !== pinConfirmacion) {
                // Alerta de que no coinciden
                MostrarAlerta('Los PINs no coinciden.');
                return;
            }
        
            Guardar_Informacion_Usuario()
        }
        return true; // ✅ Todo correcto, permite que el acordeón avance al siguiente paso
    });

    // Validación en tiempo real para la CURP
    $('#crear-usuario-input-curp').off('input.curpVal').on('input.curpVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        // Si excede los 18 caracteres, cortamos el texto automáticamente
        if (valor.length > 18) {
            valor = valor.substring(0, 18);
        }

        // Actualizamos el input visualmente si hubo cambios
        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#crear-usuario-span-curp");

        // Si aún no tiene exactamente 18 caracteres, estado neutral
        if (valor.length < 18) {
            $span.text('Faltan caracteres (18 requeridos)')
                .removeClass('text-success text-danger')
                .addClass('text-muted');
            return;
        }

        // 1. Evaluamos la sintaxis de la CURP
        let esValido = ValidacionService.validarCURP(valor);

        if (!esValido) {
            $span.text('C.U.R.P. no válida')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        // 2. Verificamos si ya existe en la variable global `window.usuarios`
        let yaExiste = window.usuarios && window.usuarios.some(u => u.curp && u.curp.toUpperCase() === valor);

        if (yaExiste) {
            $span.text('Esta C.U.R.P. ya está registrada')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('C.U.R.P. válida y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });


    // Validación en tiempo real para el RFC
    $('#crear-usuario-input-rfc').off('input.rfcVal').on('input.rfcVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        // Si excede los 13 caracteres, cortamos automáticamente
        if (valor.length > 13) {
            valor = valor.substring(0, 13);
        }

        // Actualizamos el input visualmente si hubo cambios
        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#crear-usuario-span-rfc");

        // Un RFC válido tiene 12 o 13 caracteres. Si tiene menos de 12, estado neutral.
        if (valor.length < 12) {
            $span.text('Faltan caracteres (12 o 13 requeridos)')
                .removeClass('text-success text-danger')
                .addClass('text-muted');
            return;
        }

        // 1. Evaluamos la sintaxis del RFC con el servicio
        let esValido = ValidacionService.validarRFC(valor);

        if (!esValido) {
            $span.text('R.F.C. no válido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        // 2. Verificamos si ya existe en la variable global `window.usuarios`
        let yaExiste = window.usuarios && window.usuarios.some(u => u.rfc && u.rfc.toUpperCase() === valor);

        if (yaExiste) {
            $span.text('Este R.F.C. ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('R.F.C. válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });

    // Validación en tiempo real de duplicados para el Teléfono
    $('#crear-usuario-input-telefono').off('input.telDupVal').on('input.telDupVal', function (e) {
        const $input = $(this);
        const selectorTel = "#crear-usuario-input-telefono";
        const $span = $("#crear-usuario-span-telefono");
        
        const telefonoLimpio = TelefonosUI.getValor(selectorTel);
    
        // Si el campo está vacío, limpiamos el mensaje y salimos
        if (!telefonoLimpio || telefonoLimpio.length === 0) {
            $span.text('').removeClass('text-success text-danger text-muted');
            return;
        }
    
        // Validamos formato
        if (!TelefonosUI.esValido(selectorTel)) {
            $span.text('Formato de teléfono inválido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }
    
        console.log(telefonoLimpio);
    
        // Comparamos directamente el teléfono limpio ingresado con el de la base/array
        const telefonoExiste = Array.isArray(window.usuarios) && window.usuarios.some(u => {
            if (!u.telefono) return false;
            return u.telefono === telefonoLimpio;
        });
    
        // Actualizamos la interfaz según el resultado
        if (telefonoExiste) {
            $span.text('Este teléfono ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('Teléfono disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });


    // Validación en tiempo real para el Correo Electrónico
    $('#crear-usuario-input-correo').off('input.emailVal').on('input.emailVal', function (e) {
        let $input = $(this);
        let valor = $input.val().trim();
        let $span = $("#crear-usuario-span-correo"); // Asegúrate de tener este span en tu HTML

        if (valor.length === 0) {
            $span.text('').removeClass('text-success text-danger');
            return;
        }

        // Expresión regular estándar y segura para validar correos
        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let esValido = emailRegex.test(valor);

        if (!esValido) {
            $span.text('Correo no válido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        // Verificamos si ya existe en la variable global `window.usuarios` (ignorando mayúsculas/minúsculas)
        let yaExiste = window.usuarios && window.usuarios.some(u => u.correo && u.correo.trim().toLowerCase() === valor.toLowerCase());

        if (yaExiste) {
            $span.text('Este correo ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('Correo válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });

    $('#crear-usuario-input-usuario').off('input.userVal').on('input.userVal', function (e) {
        let $input = $(this);
        let valor = $input.val().trim();
        let $span = $("#crear-usuario-span-usuario"); // Asegúrate de tener este span en tu HTML

        if (valor.length === 0) {
            $span.text('').removeClass('text-success text-danger');
            $('#btn-continuar').prop('disabled', true);
            return;
        }

        // Opcional: Validar longitud mínima o caracteres permitidos (ej. sin espacios)
        if (valor.length < 4 || /\s/.test(valor)) {
            $span.text('Mínimo 4 caracteres y sin espacios')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            $('#btn-continuar').prop('disabled', true);
            return;
        }

        // Verificamos si ya existe en la variable global `window.usuarios` (ignorando mayúsculas/minúsculas)
        let yaExiste = window.usuarios && window.usuarios.some(u => u.usuario && u.usuario.trim().toLowerCase() === valor.toLowerCase());

        if (yaExiste) {
            $span.text('Este nombre de usuario ya está en uso')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            $('#btn-continuar').prop('disabled', true);
        } else {
            $span.text('Usuario disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');

            // Aquí puedes habilitar el botón si todas las demás validaciones también pasan
            // $('#btn-continuar').prop('disabled', false);
        }
    });

    $(document).off('change.togglePass', '#crear-usuario-input-check-password').on('change.togglePass', '#crear-usuario-input-check-password', function () {
        // 1. Determinar si mostrar u ocultar basado en el estado del checkbox
        const mostrar = $(this).is(':checked');
        const nuevoTipo = mostrar ? 'text' : 'password';

        // 2. Seleccionar ambos inputs (password y confirmar password)
        const $inputs = $("#crear-usuario-input-password, #crear-usuario-input-confirm-password");

        // 3. Aplicar el cambio de tipo usando .prop()
        if ($inputs.length) {
            $inputs.prop('type', nuevoTipo);
        }

        // 4. Mantener el foco en el input principal para mejorar la experiencia de usuario (UX)
        $("#crear-usuario-input-password").focus();
    });

    // 1. Renderizar el PIN principal y el PIN de confirmación (ej. de 4 dígitos cada uno)
    $('#contenedor-pin').html(PinValidador.renderizar(4, false));
    $('#contenedor-pin-confirmacion').html(PinValidador.renderizar(4, true));

    // 2. Inicializar el servicio pasando ambos contenedores
    window.PinValidador.init({
        containerSelector: '#reglas-container-pin', // Donde se pintan los checks (incluyendo el de coincidencia)
        containerConfirmarSelector: '#contenedor-pin-confirmacion', // Selector de los inputs de confirmación
        onCambio: function (esValido, pin, pinConf) {
            // Se habilita el botón solo si pasa todas las reglas y los PINs coinciden
            $('#btn-continuar').prop('disabled', !esValido);
        }
    });
    // Evento para alternar entre mostrar u ocultar los PINs (principal y confirmación)
    $(document).off('change.togglePass', '#crear-usuario-input-check-pin').on('change.togglePass', '#crear-usuario-input-check-pin', function () {
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
});