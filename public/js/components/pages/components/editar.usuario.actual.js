$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
    if (!data || !data.seccion) return;

    window.seccion = data.seccion;

    const seccionesFormularios = {
        'personal': '#form-informacion-basica',
        'contacto': '#form-contacto'
    };

    const selectorActivo = seccionesFormularios[window.seccion];

    if (selectorActivo) {
        $(selectorActivo).removeClass('d-none');
    }
});

$(document).ready(function (e) {
    function InicilizarEditarUsuarioActual() {
        const info = window.informacion;
        if (!info) return;

        if (window.seccion === 'personal') {
            $('#input-nombre').val(info.nombre || '');
            $('#input-apellido-paterno').val(info.apellido_paterno || '');
            $('#input-apellido-materno').val(info.apellido_materno || '');
            $('#input-curp').val(info.curp || '');
            $('#input-rfc').val(info.rfc || '');

            // Inicializar Calendario
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

            if (info.fecha_nacimiento) {
                window.calendario.setRange(info.fecha_nacimiento);
            }

            // ==========================================
            // Validación en tiempo real para la CURP
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
                    return;
                }

                let esValido = ValidacionService.validarCURP(valor);

                if (!esValido) {
                    $span.text('C.U.R.P. no válida')
                        .removeClass('text-success text-muted')
                        .addClass('text-danger');
                    return;
                }

                if (valor === (info.curp || '').trim().toUpperCase()) {
                    $span.text('C.U.R.P. válida y disponible')
                        .removeClass('text-danger text-muted')
                        .addClass('text-success');
                    return;
                }

                let yaExiste = window.usuarios && window.usuarios.some(u => u.curp && u.curp.toUpperCase() === valor);

                if (yaExiste) {
                    $span.text('Esta C.U.R.P. ya está registrada por otro usuario')
                        .removeClass('text-success text-muted')
                        .addClass('text-danger');
                } else {
                    $span.text('C.U.R.P. válida y disponible')
                        .removeClass('text-danger text-muted')
                        .addClass('text-success');
                }
            });

            // ==========================================
            // Validación en tiempo real para el RFC
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
                    return;
                }

                let esValido = ValidacionService.validarRFC(valor);

                if (!esValido) {
                    $span.text('R.F.C. no válido')
                        .removeClass('text-success text-muted')
                        .addClass('text-danger');
                    return;
                }

                if (valor === (info.rfc || '').trim().toUpperCase()) {
                    $span.text('R.F.C. válido y disponible')
                        .removeClass('text-danger text-muted')
                        .addClass('text-success');
                    return;
                }

                let yaExiste = window.usuarios && window.usuarios.some(u => u.rfc && u.rfc.toUpperCase() === valor);

                if (yaExiste) {
                    $span.text('Este R.F.C. ya está registrado por otro usuario')
                        .removeClass('text-success text-muted')
                        .addClass('text-danger');
                } else {
                    $span.text('R.F.C. válido y disponible')
                        .removeClass('text-danger text-muted')
                        .addClass('text-success');
                }
            });

            // 💡 Forzar validación inicial al cargar los datos en los inputs
            $('#input-curp, #input-rfc').trigger('input');

            $("#boton-siguiente").off('click').on('click', function (e) {
                const nombre = $("#input-nombre").val().trim();
                const apellidoPaterno = $("#input-apellido-paterno").val().trim();
                const apellidoMaterno = $("#input-apellido-materno").val().trim();
                
                const datosCalendario = window.calendario ? window.calendario.getValor() : null;
                const fecha_nacimiento = datosCalendario ? datosCalendario.fecha : null;
            
                if (!nombre) {
                    MostrarAlerta('Ingresa el nombre', 250, false);
                    return false;
                }
            
                if (!apellidoPaterno) {
                    MostrarAlerta('Ingresa el apellido paterno', 250, false);
                    return false;
                }
            
                if (!apellidoMaterno) {
                    MostrarAlerta('Ingresa el apellido materno', 250, false);
                    return false;
                }
            
                if (!fecha_nacimiento) {
                    MostrarAlerta('Selecciona una fecha de nacimiento', 250, false);
                    return false;
                }
            
                const curp = $("#input-curp").val().trim().toUpperCase();
                const rfc = $("#input-rfc").val().trim().toUpperCase();
            
                if (!curp || !ValidacionService.validarCURP(curp)) {
                    MostrarAlerta('Ingresa un C.U.R.P. válido', 250, false);
                    return false;
                }
            
                if (!rfc || !ValidacionService.validarRFC(rfc)) {
                    MostrarAlerta('Ingresa un R.F.C. válido', 250, false);
                    return false;
                }

                const payload = {
                    accion: 'actualizar_informacion_usuario_actual',
                    seccion: window.seccion,
                    nombre: nombre,
                    apellido_paterno: apellidoPaterno,
                    apellido_materno: apellidoMaterno,
                    fecha_nacimiento: fecha_nacimiento,
                    curp: curp,
                    rfc: rfc
                };
                Guardar_Edicion_Usuario_Actual(payload);
            });
        }
        else if (window.seccion === 'contacto') {
            TelefonosUI.init("#input-telefono");
            AutocompletarCorreo("#input-correo");

            const telefonoOriginal = info.telefono ? info.telefono.trim() : '';
            const correoOriginal = info.correo ? info.correo.trim().toUpperCase() : '';

            $("#input-correo").val(correoOriginal);
            TelefonosUI.setValor("#input-telefono", telefonoOriginal);

            let telefonoValido = true;
            let correoValido = true;

            // Validación en tiempo real: Teléfono
            $('#input-telefono').off('input.telVal countrychange.telVal').on('input.telVal countrychange.telVal', function (e) {
                let $input = $(this);
                let valorRaw = $input.val().trim();
                let $span = $("#span-telefono");

                if (valorRaw === '') {
                    if ($span.length) {
                        $span.text('').removeClass('text-success text-danger').addClass('text-muted');
                    }
                    telefonoValido = true;
                    return;
                }

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

                if (telefonoFormateado === telefonoOriginal || valorRaw === telefonoOriginal) {
                    if ($span.length) {
                        $span.text('Teléfono válido y disponible')
                            .removeClass('text-danger text-muted')
                            .addClass('text-success');
                    }
                    telefonoValido = true;
                    return;
                }

                let yaExiste = window.usuarios && window.usuarios.some(u => u.telefono && u.telefono.trim() === telefonoFormateado);

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

            // Validación en tiempo real: Correo
            $('#input-correo').off('input.correoVal').on('input.correoVal', function (e) {
                let $input = $(this);
                let valorOriginalInput = $input.val();
                let valor = valorOriginalInput.trim().toUpperCase();

                if (valorOriginalInput !== valor) {
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

                if (valor === correoOriginal) {
                    if ($span.length) {
                        $span.text('Correo válido y disponible')
                            .removeClass('text-danger text-muted')
                            .addClass('text-success');
                    }
                    correoValido = true;
                    return;
                }

                let yaExiste = window.usuarios && window.usuarios.some(u => u.correo && u.correo.trim().toUpperCase() === valor);

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

            // 💡 Forzar validación inicial al cargar los datos de contacto
            $('#input-telefono').trigger('input');
            $('#input-correo').trigger('input');

            $("#boton-siguiente").off('click').on('click', function (e) {
                const telefono = TelefonosUI.getValor("#input-telefono");
                const correo = $("#input-correo").val().trim().toUpperCase();

                if (!telefono || !telefonoValido) {
                    MostrarAlerta('Ingresa un número de teléfono válido', 250, false);
                    return false;
                }

                if (!correo || !correoValido) {
                    MostrarAlerta('Ingresa un correo electrónico válido', 250, false);
                    return false;
                }

                const payload = {
                    accion: 'actualizar_informacion_usuario_actual',
                    seccion: window.seccion,
                    telefono: telefono,
                    correo: correo
                };
                Guardar_Edicion_Usuario_Actual(payload);
            });
        }
    }

    $(document).on('datosListos.editar_usuario_actual', function () {
        InicilizarEditarUsuarioActual();
    });
});