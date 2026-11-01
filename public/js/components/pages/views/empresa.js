
$(document).ready(async function () {
    $(document).off('datosListos.gestionEmpresa').on('datosListos.gestionEmpresa', function () {
        Iniciar_Pagina_Empresa()
        Eventos_Botones_Empresa()
        OcultarCargando()
    });
})

function Iniciar_Pagina_Empresa() {
   
    InputService.formatoRazonSocial("#empresa-input-razon-social");
    InputService.maxLength('.input-100', 100);
    InputService.correo("#empresa-input-correo");
    InputService.web("#empresa-input-web");
    InputService.aMayusculas('.input-mayus');
    const empresa = window.empresaData || {};

    // 1. Inicializar Select de Régimen Fiscal
    InsertarCustomSelect({
        contenedor: '#empresa-contenedor-select-regimen',
        id: 'select-regimen',
        placeholder: 'Selecciona un régimen',
        buscador: true,
        disabled: false,
        opciones: (window.regimenesFiscales || []).map(item => ({
            value: item.id,
            text: `${item.id} - ${item.descripcion}`
        })),
        onChange: function (valorSeleccionado) {
            console.log('Régimen seleccionado:', valorSeleccionado);
        }
    });

    if (empresa.regimen_fiscal && typeof CustomSelect !== 'undefined' && typeof CustomSelect.setValue === 'function') {
        CustomSelect.setValue("#select-regimen", empresa.regimen_fiscal);
    }

    // 2. Validación y control de RFC (Contexto Empresa)
    $('#empresa-input-rfc').off('input.rfcVal').on('input.rfcVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        if (valor.length > 13) {
            valor = valor.substring(0, 13);
        }

        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#empresa-span-rfc");

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

        $span.text('R.F.C. válido y disponible')
            .removeClass('text-danger text-muted')
            .addClass('text-success');
    });

    InputService.alfanumericoConEspacios("#empresa-input-calle");
    InputService.alfanumerico(".input-numero-calle");

    // 3. Cascada Geográfica: Estado -> Municipio -> Localidad / Código Postal (Guardando NOMBRES)
    const estados = typeof ObtenerEstados === 'function' ? ObtenerEstados(window.localidades) : [];
    
    $('#contenedor-select-estado').empty();

    InsertarCustomSelect({
        contenedor: '#contenedor-select-estado',
        id: 'select-estado',
        placeholder: 'Selecciona un estado',
        buscador: true,
        disabled: false,
        opciones: estados.map(item => ({
            value: item.estado, // Guardamos el NOMBRE del estado, no la clave
            text: item.estado
        })),
        onChange: function (estadoNombre) {
            const estadoObj = estados.find(e => e.estado === estadoNombre);
            const claveEstado = estadoObj ? estadoObj.clave : null;
            const municipios = claveEstado ? ObtenerMunicipiosPorEstado(window.localidades, claveEstado) : [];

            InsertarCustomSelect({
                contenedor: '#contenedor-select-municipio',
                id: 'select-municipio',
                placeholder: 'Selecciona un municipio',
                opciones: municipios.map(m => ({
                    value: m.municipio, // Guarda el nombre del municipio
                    text: m.municipio
                })),
                buscador: true,
                disabled: false,
                onChange: function (municipioNombre) {
                    const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(window.localidades, municipioNombre);

                    InsertarCustomSelect({
                        contenedor: '#contenedor-select-localidad',
                        id: 'select-localidad',
                        placeholder: 'Selecciona una localidad / colonia',
                        opciones: localidadesFiltradas.map(item => ({
                            value: item.localidad, // Guardamos el NOMBRE de la localidad/colonia
                            text: item.localidad
                        })),
                        buscador: true,
                        disabled: false,
                        onChange: function (coloniaNombre) {
                            const localidadSeleccionadaObjeto = localidadesFiltradas.find(item => item.localidad === coloniaNombre);
                            if (localidadSeleccionadaObjeto) {
                                $("#empresa-span-codigo-postal").text(localidadSeleccionadaObjeto.codigo || '---');
                            }
                        }
                    });
                }
            });
        }
    });

    // 4. Llenar datos iniciales si estamos en modo Edición (window.empresaData)
    if (window.empresaData) {
        $("#empresa-input-razon-social").val(empresa.razon_social || '');
        $("#empresa-input-rfc").val(empresa.rfc || '').trigger('input');
        $("#empresa-input-calle").val(empresa.calle || '');
        $("#empresa-input-num-ext").val(empresa.numero_exterior || '');
        $("#empresa-input-num-int").val(empresa.numero_interior || '');
        $("#empresa-span-codigo-postal").text(empresa.codigo_postal || '---');

        if (empresa.telefono && typeof TelefonosUI !== 'undefined') {
            TelefonosUI.setValor("#empresa-input-telefono", empresa.telefono);
        }
        if (empresa.telefono_adicional && typeof TelefonosUI !== 'undefined') {
            TelefonosUI.setValor("#empresa-input-telefono-adicional", empresa.telefono_adicional);
        }
        $("#empresa-input-correo").val(empresa.correo || '');
        if (empresa.whatsapp && typeof TelefonosUI !== 'undefined') {
            TelefonosUI.setValor("#empresa-input-whatsapp", empresa.whatsapp);
        }
        $("#empresa-input-web").val(empresa.web || '');

        // Preselección en cascada para edición
        if (empresa.estado && typeof CustomSelect !== 'undefined' && typeof CustomSelect.setValue === 'function') {
            CustomSelect.setValue("#select-estado", empresa.estado);
            
            setTimeout(() => {
                const estadoObj = estados.find(e => e.estado === empresa.estado);
                if (estadoObj) {
                    const municipios = ObtenerMunicipiosPorEstado(window.localidades, estadoObj.clave);
                    InsertarCustomSelect({
                        contenedor: '#contenedor-select-municipio',
                        id: 'select-municipio',
                        placeholder: 'Selecciona un municipio',
                        opciones: municipios.map(m => ({ value: m.municipio, text: m.municipio })),
                        buscador: true,
                        disabled: false,
                        onChange: function (municipioNombre) {
                            const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(window.localidades, municipioNombre);
                            InsertarCustomSelect({
                                contenedor: '#contenedor-select-localidad',
                                id: 'select-localidad',
                                placeholder: 'Selecciona una localidad / colonia',
                                opciones: localidadesFiltradas.map(item => ({ value: item.localidad, text: item.localidad })),
                                buscador: true,
                                disabled: false,
                                onChange: function (coloniaNombre) {
                                    const locObj = localidadesFiltradas.find(i => i.localidad === coloniaNombre);
                                    if (locObj) {
                                        $("#empresa-span-codigo-postal").text(locObj.codigo || '---');
                                    }
                                }
                            });
                            if (empresa.colonia) {
                                CustomSelect.setValue("select-localidad", empresa.colonia);
                            }
                        }
                    });
                    CustomSelect.setValue("#select-municipio", empresa.municipio);

                    const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(window.localidades, empresa.municipio);
                    InsertarCustomSelect({
                        contenedor: '#contenedor-select-localidad',
                        id: 'select-localidad',
                        placeholder: 'Selecciona una localidad / colonia',
                        opciones: localidadesFiltradas.map(item => ({ value: item.localidad, text: item.localidad })),
                        buscador: true,
                        disabled: false,
                        onChange: function (coloniaNombre) {
                            const locObj = localidadesFiltradas.find(i => i.localidad === coloniaNombre);
                            if (locObj) {
                                $("#empresa-span-codigo-postal").text(locObj.codigo || '---');
                            }
                        }
                    });
                    if (empresa.colonia) {
                        CustomSelect.setValue("#select-localidad", empresa.colonia);
                    }
                }
            }, 50);
        }
    }

    // 5. Inicialización de teléfonos y correos
    if (typeof TelefonosUI !== 'undefined') {
        TelefonosUI.init("#empresa-input-telefono");
        TelefonosUI.init("#empresa-input-telefono-adicional");
        TelefonosUI.init("#empresa-input-whatsapp");
    }

    if (typeof AutocompletarCorreo === 'function') {
        AutocompletarCorreo("#empresa-input-correo");
    }

    
}

function Eventos_Botones_Empresa() {
    $("#btn-guardar").off('click').on('click', function (e) {
        e.preventDefault();

        // 1. Recolección de valores de inputs tradicionales
        const razonSocial = $("#empresa-input-razon-social").val().trim();
        const rfc = $("#empresa-input-rfc").val().trim().toUpperCase();
        const calle = $("#empresa-input-calle").val().trim();
        const numeroExterior = $("#empresa-input-num-ext").val().trim();
        const numeroInterior = $("#empresa-input-num-int").val().trim();
        const codigoPostal = $("#empresa-span-codigo-postal").text().trim();
        
        const telefono = $("#empresa-input-telefono").val().trim();
        const telefonoAdicional = $("#empresa-input-telefono-adicional").val().trim();
        const correo = $("#empresa-input-correo").val().trim();
        const whatsapp = $("#empresa-input-whatsapp").val().trim();
        const web = $("#empresa-input-web").val().trim();

        // 2. Recolección de valores desde los Custom Selects (Devuelven los NOMBRES seleccionados)
        const regimenFiscal = CustomSelect.getValue("#select-regimen");
        const estado = CustomSelect.getValue("#select-estado");
        const municipio = CustomSelect.getValue("#select-municipio");
        const colonia = CustomSelect.getValue("#select-localidad");

        // ==========================================
        // 3. VALIDACIONES OBLIGATORIAS Y CONDICIONALES
        // ==========================================

        // --- Información Fiscal ---
        if (!razonSocial) {
            MostrarAlerta('Por favor, ingresa la Razón Social de la empresa', 250);
            $("#empresa-input-razon-social").focus();
            return;
        }

        if (!rfc) {
            MostrarAlerta('Por favor, ingresa el R.F.C.', 250);
            $("#empresa-input-rfc").focus();
            return;
        }

        if (rfc.length < 12 || rfc.length > 13) {
            MostrarAlerta('El R.F.C. debe tener exactamente 12 o 13 caracteres', 250);
            $("#empresa-input-rfc").focus();
            return;
        }

        if (typeof ValidacionService !== 'undefined' && typeof ValidacionService.validarRFC === 'function') {
            if (!ValidacionService.validarRFC(rfc)) {
                MostrarAlerta('El formato del R.F.C. no es válido', 250);
                $("#empresa-input-rfc").focus();
                return;
            }
        }

        if (!regimenFiscal) {
            MostrarAlerta('Por favor, selecciona un Régimen Fiscal', 250);
            return;
        }

        // --- Domicilio Fiscal (Obligatorio) ---
        if (!calle) {
            MostrarAlerta('Por favor, ingresa la calle del domicilio fiscal', 250);
            $("#empresa-input-calle").focus();
            return;
        }

        if (!numeroExterior) {
            MostrarAlerta('Por favor, ingresa el número exterior', 250);
            $("#empresa-input-num-ext").focus();
            return;
        }

        if (!estado) {
            MostrarAlerta('Por favor, selecciona el Estado', 250);
            return;
        }

        if (!municipio) {
            MostrarAlerta('Por favor, selecciona el Municipio / Alcaldía', 250);
            return;
        }

        if (!colonia) {
            MostrarAlerta('Por favor, selecciona la Localidad', 250);
            return;
        }

        if (!codigoPostal || codigoPostal === '---') {
            MostrarAlerta('El código postal es obligatorio y se asigna con la localidad', 250);
            return;
        }

        // --- Validaciones Condicionales de Contacto y Medios ---
        if (telefono !== '') {
            if (typeof TelefonosUI !== 'undefined' && !TelefonosUI.esValido("#empresa-input-telefono")) {
                MostrarAlerta('El teléfono principal ingresado no es válido o está incompleto', 250);
                $("#empresa-input-telefono").focus();
                return;
            }
        }

        if (telefonoAdicional !== '') {
            if (typeof TelefonosUI !== 'undefined' && !TelefonosUI.esValido("#empresa-input-telefono-adicional")) {
                MostrarAlerta('El teléfono adicional ingresado no es válido o está incompleto', 250);
                $("#empresa-input-telefono-adicional").focus();
                return;
            }
        }

        if (correo !== '') {
            if (typeof ValidacionService !== 'undefined' && !ValidacionService.validarCorreo(correo)) {
                MostrarAlerta('El formato del correo electrónico no es válido', 250);
                $("#empresa-input-correo").focus();
                return;
            }
        }

        if (whatsapp !== '') {
            if (typeof TelefonosUI !== 'undefined' && !TelefonosUI.esValido("#empresa-input-whatsapp")) {
                MostrarAlerta('El número de WhatsApp ingresado no es válido o está incompleto', 250);
                $("#empresa-input-whatsapp").focus();
                return;
            }
        }

        if (web !== '') {
            if (typeof ValidacionService !== 'undefined' && typeof ValidacionService.validarSitioWeb === 'function') {
                if (!ValidacionService.validarSitioWeb(web)) {
                    MostrarAlerta('El formato del sitio web no es válido', 250);
                    $("#empresa-input-web").focus();
                    return;
                }
            }
        }

        // 4. Estructura de datos a enviar al backend
        const datosEmpresa = {
            accion: 'guardar_informacion_empresa',
            razon_social: razonSocial,
            rfc: rfc,
            regimen_fiscal: regimenFiscal,
            calle: calle,
            numero_exterior: numeroExterior,
            numero_interior: numeroInterior,
            colonia: colonia, // Se envía el nombre de la localidad/colonia
            codigo_postal: codigoPostal,
            municipio: municipio, // Se envía el nombre del municipio
            estado: estado, // Se envía el nombre del estado
            telefono: telefono !== '' && typeof TelefonosUI !== 'undefined' ? TelefonosUI.getValor("#empresa-input-telefono") : telefono,
            telefono_adicional: telefonoAdicional !== '' && typeof TelefonosUI !== 'undefined' ? TelefonosUI.getValor("#empresa-input-telefono-adicional") : telefonoAdicional,
            correo: correo,
            whatsapp: whatsapp !== '' && typeof TelefonosUI !== 'undefined' ? TelefonosUI.getValor("#empresa-input-whatsapp") : whatsapp,
            web: web
        };

        // Llamada a la función de guardado
        if (typeof Guardar_Gestion_Empresa === 'function') {
            Guardar_Gestion_Empresa(datosEmpresa);
        } else {
            console.log("Datos listos para guardar empresa:", datosEmpresa);
        }
    });
    $("#btn-atras").off('click').on('click',async function (e) {
        window.location.href="ajustes.php"  
    })
}