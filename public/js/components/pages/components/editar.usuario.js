const esperarDatosIniciales = new Promise((resolve) => {
    let recibido = false;

    if (window.$.messenger && typeof window.$.messenger.on === 'function') {
        window.$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
            if (data && (data.id || data.ID)) {
                window.id_usuario= data.id || data.ID;
                window.seccion = data.seccion;
                recibido = true;
            }
            resolve(window.id_cliente);
        });
    }
});


$(document).ready(function () {

    InputService.aMayusculas('.input-mayus');
    InputService.maxLength('.input-100', 100);
    InputService.alfanumericoConEspacios(".input-alfanumerico");
    InputService.correo(".input-correo");

    function InicilizarGestionarUsuario() {
       
    
        console.log("Sección activa:", window.seccion);
    
        // 2. Mapeo de secciones y formularios
        const secciones = {
            básica: '#usuario-basico',
            identidad: '#usuario-identidad',
            contacto: '#usuario-contacto',

        };
    
        // Ocultamos todos los formularios primero
        Object.values(secciones).forEach(selector => $(selector).addClass('d-none'));
    
        // Mostramos únicamente el formulario correspondiente a la sección activa
        const selectorActivo = secciones[window.seccion];
        if (selectorActivo) {
            $(selectorActivo).removeClass('d-none');
        }
        // 4. Inicialización de eventos específicos según la sección activa
        switch (window.seccion) {
            case 'básica':
                if (typeof Eventos_Seccion_Informacion_Basica === 'function') {
                    Eventos_Seccion_Informacion_Basica();
                }
                break;
            case 'identidad':
                if (typeof Eventos_Seccion_Identidad === 'function') {
                    Eventos_Seccion_Identidad();
                }
                break;
            case 'contacto':
                if (typeof Eventos_Seccion_Contacto === 'function') {
                    Eventos_Seccion_Contacto();
                }
                break;
            default:
                console.warn(`Sección desconocida: ${window.seccion}`);
        }
    
        // 5. Registro seguro de navegación entre pasos del formulario
        const navegacionPasos = [
            { form: '#usuario-basico', btn: '#informacion-basica-boton-siguiente' },
            { form: '#usuario-identidad', btn: '#identidad-boton-siguiente' },
            { form: '#usuario.contacto', btn: '#contacto-boton-siguiente' }
        ];
    
        navegacionPasos.forEach(paso => {
            if ($(paso.form).length && $(paso.btn).length && typeof FormNavigationService !== 'undefined') {
                FormNavigationService.registrar(paso.form, paso.btn);
            }
        });
    }

    $(document).on('datosListos', function () {
        InicilizarGestionarUsuario();
    });
});

function Eventos_Seccion_Informacion_Basica() {
    // 1. Inicializar el calendario con el rango adecuado para fechas de nacimiento
    window.calendario = Calendario.init({
        tipo: 'single',
        contenedor: '#contenedor-fecha-nacimiento',
        idInput: 'fechaSeleccionada',
        idBtnAnterior: 'btnMesAnterior',
        idBtnSiguiente: 'btnMesSiguiente',
        orientacion: 'horizontal',
        minDate: '1900-01-01',
        maxDate: '2026-12-31',
        onChange: function (fecha) {
            console.log("Fecha seleccionada:", fecha);
        }
    });

    // 2. Cargar la información existente si se trata de una edición
    if (window.informacion) {
        if (window.calendario && window.informacion.fecha_nacimiento) {
            window.calendario.setRange(window.informacion.fecha_nacimiento);
        }

        $("#input-nombre").val(window.informacion.nombre || '');
        $("#input-apellido-paterno").val(window.informacion.apellido_paterno || '');
        $("#input-apellido-materno").val(window.informacion.apellido_materno || '');
    }

    // 3. Manejador del botón guardar con validación directa y MostrarAlerta
    $("#editar-usuario-boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();

        const nombreVal = $("#input-nombre").val().trim();
        const apellidoPaternoVal = $("#input-apellido-paterno").val().trim();
        const apellidoMaternoVal = $("#input-apellido-materno").val().trim();

        // Obtener la fecha en formato YYYY-MM-DD desde el método del calendario
        const datosCalendario = window.calendario ? window.calendario.getValor() : null;
        const fechaNacimientoBD = datosCalendario ? datosCalendario.fecha : '';

        // Validaciones directas con MostrarAlerta y parámetros 230, false
        if (nombreVal === '') {
            MostrarAlerta('El campo Nombre es obligatorio.', 230, false);
            return;
        }

        if (nombreVal.length < 2) {
            MostrarAlerta('El nombre debe tener al menos 2 caracteres.', 230, false);
            return;
        }

        if (apellidoPaternoVal === '') {
            MostrarAlerta('El campo Apellido Paterno es obligatorio.', 230, false);
            return;
        }

        if (fechaNacimientoBD === '') {
            MostrarAlerta('Por favor seleccione una fecha de nacimiento válida.', 230, false);
            return;
        }

        // Construir el payload con los campos validados
        const payload = {
            ejecutar: 'editar_informacion_basica',
            id: window.id_usuario,
            nombre: nombreVal,
            apellido_paterno: apellidoPaternoVal,
            apellido_materno: apellidoMaternoVal,
            fecha_nacimiento: fechaNacimientoBD
        };

        console.log("Payload de información básica generado:", payload);

        // Enviar a la función de guardado
        Guardar_Edicion_Usuario(payload);
    });
}

function Eventos_Seccion_Identidad(){
    
    const usuarioActualID = window.id_usuario ? Number(window.id_usuario) : null;
    
    const curpOriginal = (window.informacion && window.informacion.curp) ? window.informacion.curp.trim().toUpperCase() : '';
    const rfcOriginal = (window.informacion && window.informacion.rfc) ? window.informacion.rfc.trim().toUpperCase() : '';

    // Banderas lógicas para controlar la validez de los campos de forma robusta
    let curpValida = true;
    let rfcValida = true;

    const validarInputInicial = ($elemento) => {
        $elemento.trigger('input');
    };

    $("#input-curp").val(window.informacion.curp || '');
    validarInputInicial($("#input-curp"));

    $("#input-rfc").val(window.informacion.rfc || '');
    validarInputInicial($("#input-rfc"));

    // ==========================================
    // VALIDACIÓN EN TIEMPO REAL: CURP
    // ==========================================
    $('#input-curp').off('input.curpVal').on('input.curpVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        if (valor.length > 18) {
            valor = valor.substring(0, 18);
        }

        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#span-curp");

        if (valor.length < 18) {
            $span.text('Faltan caracteres (18 requeridos)')
                .removeClass('text-success text-danger')
                .addClass('text-muted');
            curpValida = false;
            return;
        }

        let esSintaxisValida = ValidacionService.validarCURP(valor);

        if (!esSintaxisValida) {
            $span.text('C.U.R.P. no válida')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            curpValida = false;
            return;
        }

        // Si es el mismo valor que ya tenía el usuario actual, se aprueba
        if (valor === curpOriginal) {
            $span.text('C.U.R.P. válida y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
            curpValida = true;
            return;
        }

        // Verificación de duplicados excluyendo al usuario actual
        let yaExiste = window.usuarios && window.usuarios.some(u => {
            const idComparar = Number(u.ID || u.id);
            return idComparar !== usuarioActualID && u.curp && u.curp.toUpperCase() === valor;
        });

        if (yaExiste) {
            $span.text('Esta C.U.R.P. ya está registrada por otro usuario')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            curpValida = false;
        } else {
            $span.text('C.U.R.P. válida y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
            curpValida = true;
        }
    });

    // ==========================================
    // VALIDACIÓN EN TIEMPO REAL: RFC
    // ==========================================
    $('#input-rfc').off('input.rfcVal').on('input.rfcVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        if (valor.length > 13) {
            valor = valor.substring(0, 13);
        }

        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#span-rfc");

        if (valor.length < 12) {
            $span.text('Faltan caracteres (12 o 13 requeridos)')
                .removeClass('text-success text-danger')
                .addClass('text-muted');
            rfcValida = false;
            return;
        }

        let esSintaxisValida = ValidacionService.validarRFC(valor);

        if (!esSintaxisValida) {
            $span.text('R.F.C. no válido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            rfcValida = false;
            return;
        }

        // Si es el mismo valor que ya tenía el usuario actual, se aprueba
        if (valor === rfcOriginal) {
            $span.text('R.F.C. válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
            rfcValida = true;
            return;
        }

        // Verificación de duplicados excluyendo al usuario actual
        let yaExiste = window.usuarios && window.usuarios.some(u => {
            const idComparar = Number(u.ID || u.id);
            return idComparar !== usuarioActualID && u.rfc && u.rfc.toUpperCase() === valor;
        });

        if (yaExiste) {
            $span.text('Este R.F.C. ya está registrado por otro usuario')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            rfcValida = false;
        } else {
            $span.text('R.F.C. válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
            rfcValida = true;
        }
    });

    // ==========================================
    // BOTÓN GUARDAR CON VALIDACIÓN DIRECTA
    // ==========================================
    $("#editar-usuario-boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();

        const curpVal = $("#input-curp").val().trim();
        const rfcVal = $("#input-rfc").val().trim();

        // Validaciones directas con MostrarAlerta y parámetros 230, false
        if (curpVal !== '' && !curpValida) {
            MostrarAlerta('La CURP no es válida o ya se encuentra registrada por otro usuario.', 230, false);
            return;
        }

        if (rfcVal !== '' && !rfcValida) {
            MostrarAlerta('El RFC no es válido o ya se encuentra registrado por otro usuario.', 230, false);
            return;
        }

        const payload = {
            ejecutar: 'editar_identidad',
            id: window.id_usuario,
            curp: curpVal,
            rfc: rfcVal
        };

        Guardar_Edicion_Usuario(payload);
    });
}

function Eventos_Seccion_Contacto() {
    console.log(window.informacion);

    const usuarioActualID = window.id_usuario ? Number(window.id_usuario) : null;

    const telefonoOriginal = (window.informacion && window.informacion.telefono) ? window.informacion.telefono.trim() : '';
    const correoOriginal = (window.informacion && window.informacion.correo) ? window.informacion.correo.trim().toLowerCase() : '';

    // Banderas lógicas para controlar la validez de los campos
    let correoValido = true;
    let telefonoValido = true;

    // Inicializar componentes externos usando el módulo centralizado
    TelefonosUI.init("#input-telefono");
    AutocompletarCorreo("#input-correo");

    const validarInputInicial = ($elemento) => {
        $elemento.trigger('input');
    };

    // Establecer valor inicial del teléfono utilizando el módulo
    TelefonosUI.setValor("#input-telefono", telefonoOriginal);
    
    // Validar estado inicial del teléfono si ya viene con datos
    if (telefonoOriginal !== '') {
        telefonoValido = TelefonosUI.esValido("#input-telefono");
    }

    $("#input-correo").val(window.informacion.correo || '');
    validarInputInicial($("#input-correo"));

    // ==========================================
    // VALIDACIÓN EN TIEMPO REAL: TELÉFONO
    // ==========================================
    $('#input-telefono').off('input.telVal countrychange.telVal').on('input.telVal countrychange.telVal', function (e) {
        let $input = $(this);
        let valorRaw = $input.val().trim();
        let $span = $("#span-telefono"); // Asegúrate de tener <span id="span-telefono"></span> en tu HTML

        if (valorRaw === '') {
            if ($span.length) {
                $span.text('')
                    .removeClass('text-success text-danger')
                    .addClass('text-muted');
            }
            telefonoValido = true; // Si es opcional, o ponlo en false si es obligatorio
            return;
        }

        // Usamos el método nativo esValido() de tu módulo TelefonosUI
        let esValidoIntl = TelefonosUI.esValido("#input-telefono");
        const telefonoFormateado = TelefonosUI.getValor("#input-telefono");

        if (!esValidoIntl) {
            if ($span.length) {
                $span.text('Número de teléfono incompleto o no válido para el país')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
            }
            telefonoValido = false;
            return;
        }

        // Si es el mismo valor normalizado que ya tenía el usuario actual, se aprueba
        if (telefonoFormateado === telefonoOriginal || valorRaw === telefonoOriginal) {
            if ($span.length) {
                $span.text('Teléfono válido y disponible')
                    .removeClass('text-danger text-muted')
                    .addClass('text-success');
            }
            telefonoValido = true;
            return;
        }

        // Verificación de duplicados excluyendo al usuario actual
        let yaExiste = window.usuarios && window.usuarios.some(u => {
            const idComparar = Number(u.ID || u.id);
            return idComparar !== usuarioActualID && u.telefono && u.telefono.trim() === telefonoFormateado;
        });

        if (yaExiste) {
            if ($span.length) {
                $span.text('Este teléfono ya está registrado por otro usuario')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
            }
            telefonoValido = false;
        } else {
            if ($span.length) {
                $span.text('Teléfono válido y disponible')
                    .removeClass('text-danger text-muted')
                    .addClass('text-success');
            }
            telefonoValido = true;
        }
    });

    // ==========================================
    // VALIDACIÓN EN TIEMPO REAL: CORREO
    // ==========================================
    $('#input-correo').off('input.correoVal').on('input.correoVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toLowerCase();

        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#span-correo");

        if (valor.length === 0) {
            if ($span.length) {
                $span.text('El correo electrónico es requerido')
                    .removeClass('text-success text-danger')
                    .addClass('text-muted');
            }
            correoValido = false;
            return;
        }

        let esSintaxisValida = ValidacionService.validarCorreo ? ValidacionService.validarCorreo(valor) : true;

        if (!esSintaxisValida) {
            if ($span.length) {
                $span.text('Correo electrónico no válido')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
            }
            correoValido = false;
            return;
        }

        // Si es el mismo valor que ya tenía el usuario actual, se aprueba
        if (valor === correoOriginal) {
            if ($span.length) {
                $span.text('Correo válido y disponible')
                    .removeClass('text-danger text-muted')
                    .addClass('text-success');
            }
            correoValido = true;
            return;
        }

        // Verificación de duplicados excluyendo al usuario actual
        let yaExiste = window.usuarios && window.usuarios.some(u => {
            const idComparar = Number(u.ID || u.id);
            return idComparar !== usuarioActualID && u.correo && u.correo.trim().toLowerCase() === valor;
        });

        if (yaExiste) {
            if ($span.length) {
                $span.text('Este correo ya está registrado por otro usuario')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
            }
            correoValido = false;
        } else {
            if ($span.length) {
                $span.text('Correo válido y disponible')
                    .removeClass('text-danger text-muted')
                    .addClass('text-success');
            }
            correoValido = true;
        }
    });

    // ==========================================
    // BOTÓN GUARDAR CON VALIDACIÓN DIRECTA
    // ==========================================
    $("#editar-usuario-boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();

        const telefonoLimpioInput = $("#input-telefono").val().trim();
        const telefonoVal = TelefonosUI.getValor("#input-telefono");
        const correoVal = $("#input-correo").val().trim().toUpperCase();

        // Validar si escribió algo pero el plugin lo marca como inválido
        if (telefonoLimpioInput !== '' && !telefonoValido) {
            MostrarAlerta('El teléfono no es válido o está incompleto para el país seleccionado.', 230, false);
            return;
        }

        if (correoVal !== '' && !correoValido) {
            MostrarAlerta('El correo electrónico no es válido o ya se encuentra registrado por otro usuario.', 250, false);
            return;
        }

        const payload = {
            ejecutar: 'editar_contacto',
            id: window.id_usuario,
            telefono: telefonoVal,
            correo: correoVal
        };

        Guardar_Edicion_Usuario(payload);
    });
}