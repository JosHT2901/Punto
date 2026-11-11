const esperarDatosIniciales = new Promise((resolve) => {
    let recibido = false;
    
    if (window.$.messenger && typeof window.$.messenger.on === 'function') {
        window.$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
            if (data && (data.id || data.ID)) {
                window.id_impuesto = data.id || data.ID;
                recibido = true;
            }
            resolve(window.id_impuesto);
        });
        
        // Timeout de seguridad por si no se reciben datos iniciales (modo creación o carga directa sin iframe/messenger)
        setTimeout(() => {
            if (!recibido) {
                resolve(null);
            }
        }, 300);
    } else {
        resolve(null);
    }
});

$(document).ready(async function () {
    let inicializado = false;
console.log("##")
    function InicializarGestionarEsquemasFiscales() {
        if (inicializado) return;
        inicializado = true;
        
        InputService.aMayusculas('.input-mayus');
        InicializarAcordeonUniversal();
        
        // Configuración de inputs numéricos
        InputService.numerosDecimales("#esquema-input-ieps", 2, 'left', 'Ej. 8 para 8%');
        InputService.numerosDecimales("#esquema-input-cuota-litro", 4, 'left', 'Ej. 1.5086');
        InputService.numerosDecimales("#esquema-input-cuota-unidad", 4, 'left', 'Ej. 0.5000');
        InputService.numerosDecimales("#esquema-input-ret-isr", 2, 'left', 'Ej. 1.25 para 1.25%');
        InputService.numerosDecimales("#esquema-input-ret-iva", 2, 'left', 'Ej. 10.66 para 10.66%');
        // Asignación segura del símbolo de moneda
        const simboloMoneda = (typeof variablesMap !== 'undefined' && variablesMap.simbolo_moneda) ? variablesMap.simbolo_moneda : '$';
        $('.span-moneda').text(simboloMoneda);

        InsertarCustomSelect({
            contenedor: '#impuestos-select-iva',
            id: 'select-iva',
            placeholder: 'Selecciona tasa de IVA...',
            opciones: [
                { value: '0.1600', text: '16.00% (General)' },
                { value: '0.0800', text: '8.00% (Fronteriza)' },
                { value: '0.0000', text: '0.00% (Tasa Cero / Exento)' }
            ],
            buscador: false,
            onChange: () => {
                if (typeof ValidarEsquemaFiscal === 'function') {
                    ValidarEsquemaFiscal();
                }
            }
        });

        if (window.impuestoActual) {
            // Si la respuesta viene estructurada dentro de la propiedad .datos (por el JsonResponse::success)
            const impuesto = window.impuestoActual.datos || window.impuestoActual;
            console.log(impuesto);
            
            // Guardamos el ID en el formulario o en un campo oculto
            $('#form-gestion-esquema-fiscal').data('id-esquema', impuesto.ID || impuesto.id || impuesto.id_esquema);
            
            // Rellenar nombre
            $('#esquema-input-nombre').val(impuesto.nombre || impuesto.nombre_esquema || '').trigger('input');
            
            // Asignar valor al custom select de IVA utilizando el formato decimal exacto (ej. '0.1600') para que coincida con las opciones
            const tasaIvaVal = impuesto.tasa_iva_decimal !== undefined ? impuesto.tasa_iva_decimal : impuesto.tasa_iva;
            if (tasaIvaVal !== undefined && typeof CustomSelect !== 'undefined') {
                // Aseguramos formato de 4 decimales para que coincida perfectamente con '0.1600', '0.0800', '0.0000'
                let valorFormateado = parseFloat(tasaIvaVal);
                if (!isNaN(valorFormateado)) {
                    if (valorFormateado > 1) valorFormateado = valorFormateado / 100;
                    CustomSelect.setValue('#select-iva', valorFormateado.toFixed(4));
                }
            }
        
            // Función auxiliar para limpiar sufijos o símbolos de moneda
            const obtenerValorNumerico = (val) => {
                if (val === undefined || val === null) return '';
                if (typeof val === 'number') return val;
                return val.toString().replace(/[^0-9.-]+/g, "");
            };
        
            $('#esquema-input-ieps').val(
                impuesto.tasa_ieps_porcentaje !== undefined ? 
                impuesto.tasa_ieps_porcentaje : 
                obtenerValorNumerico(impuesto.tasa_ieps)
            );
        
            $('#esquema-input-cuota-litro').val(obtenerValorNumerico(impuesto.ieps_cuota_litro));
            $('#esquema-input-cuota-unidad').val(obtenerValorNumerico(impuesto.ieps_cuota_unidad));
        
            $('#esquema-input-ret-isr').val(
                impuesto.retencion_isr_porcentaje !== undefined ? 
                impuesto.retencion_isr_porcentaje : 
                obtenerValorNumerico(impuesto.retencion_isr)
            );
        
            $('#esquema-input-ret-iva').val(
                impuesto.retencion_iva_porcentaje !== undefined ? 
                impuesto.retencion_iva_porcentaje : 
                obtenerValorNumerico(impuesto.retencion_iva)
            );
            
            // Cambiar texto del botón a Actualizar
            $('#esquema-boton-guardar').text('Actualizar');
        }

        // ==========================================
        // VALIDACIÓN DE NOMBRE DUPLICADO (EN VIVO)
        // ==========================================
        $(document).on('input.valNombre', '#esquema-input-nombre', function () {
            const nombreIngresado = $(this).val().trim().toUpperCase();
            const $spanError =$('#impuesto-span-nombre');
            const idActual = $('#form-gestion-esquema-fiscal').data('id-esquema');

            if (window.esquemas && Array.isArray(window.esquemas)) {
                const existe = window.esquemas.some(esquema => {
                    const idEsquemaItem = esquema.id || esquema.id_esquema;
                    // Si estamos editando, ignoramos el registro actual para que no marque error con su propio nombre
                    if (idActual && String(idEsquemaItem) === String(idActual)) {
                        return false;
                    }
                    const nombreExistente = (esquema.nombre || esquema.nombre_esquema || '').trim().toUpperCase();
                    return nombreExistente === nombreIngresado;
                });

                if (existe && nombreIngresado !== "") {
                    $spanError.text('Este nombre de esquema ya existe.');
                } else {
                    $spanError.text('');
                }
            }
        });

        // ==========================================
        // CONFIGURACIÓN DE TOOLTIPS DE AYUDA (Unificado)
        // ==========================================
        const ayudas = [
            { id: '#boton-ayuda-ieps', titulo: 'Tasa I.E.P.S.', desc: 'Porcentaje directo sobre el valor del producto (Ej: 8 para 8%).' },
            { id: '#boton-ayuda-cuota-litro', titulo: 'Cuota Fija por Litro', desc: 'Monto fijo en pesos que se paga por cada litro (Ej: 1.5086).' },
            { id: '#boton-ayuda-cuota-unidad', titulo: 'Cuota Fija por Unidad', desc: 'Monto fijo en pesos que se paga por cada pieza o unidad (Ej: 0.5000).' },
            { id: '#boton-ayuda-ret-isr', titulo: 'Retención de I.S.R.', desc: 'Porcentaje directo de retención del Impuesto Sobre la Renta (Ej: 1.25 para 1.25%).' },
            { id: '#boton-ayuda-ret-iva', titulo: 'Retención de I.V.A.', desc: 'Porcentaje directo de retención del Impuesto al Valor Agregado (Ej: 10.66 para 10.66%).' }
        ];

        ayudas.forEach(item => {
            $(item.id).on('mouseenter', function () {
                TooltipAPI.mostrar(this, `<strong>${item.titulo}:</strong><br>${item.desc}`);
            }).on('mouseleave', function () {
                TooltipAPI.ocultar();
            });
        });
    }

    // Inicialización si los datos ya están listos
    if (window.esquemas || window.esquemasFiscales || window.impuestosEsquemas || window.esquemaSeleccionado || window.esquemaAEditar) {
        InicializarGestionarEsquemasFiscales();
    }

    // Escucha del evento personalizado
    $(document).off('datosListos.gestionEsquemasFiscales').on('datosListos.gestionEsquemasFiscales', function () {
        InicializarGestionarEsquemasFiscales();
    });
});

// ==========================================
// EVENTO GUARDAR / ACTUALIZAR
// ==========================================
$('#esquema-boton-guardar').on('click', async function (e) {
    e.preventDefault();

    const idEsquema = $('#form-gestion-esquema-fiscal').data('id-esquema');
    const esEdicion = Boolean(idEsquema);

    const nombre = $('#esquema-input-nombre').val().trim();
    const iva = typeof CustomSelect !== 'undefined' ? CustomSelect.getValue('#select-iva') : $('#select-iva').val();
    
    // Limpiamos los campos de porcentaje y moneda por si contienen símbolos o texto formateado antes de enviarlos al backend
    const limpiarValor = (val) => {
        if (!val) return '0';
        return val.toString().replace(/[^0-9.-]+/g, "");
    };

    const ieps = limpiarValor($('#esquema-input-ieps').val());
    const ieps_cuota_litro = limpiarValor($('#esquema-input-cuota-litro').val());
    const ieps_cuota_unidad = limpiarValor($('#esquema-input-cuota-unidad').val());
    const retencion_isr = limpiarValor($('#esquema-input-ret-isr').val());
    const retencion_iva = limpiarValor($('#esquema-input-ret-iva').val());

    // 1. Validar nombre vacío
    if (!nombre) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ingresa el nombre del esquema fiscal.', 'warning');
        } else if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ingresa el nombre del esquema fiscal.', false, true, false);
        }
        $('#esquema-input-nombre').focus();
        return;
    }

    // 2. Validar duplicados de nombre
    const nombreMayus = nombre.toUpperCase();
    if (window.esquemas && Array.isArray(window.esquemas)) {
        const existe = window.esquemas.some(esquema => {
            const idEsquemaItem = esquema.id || esquema.ID || esquema.id_esquema;
            if (esEdicion && String(idEsquemaItem) === String(idEsquema)) {
                return false;
            }
            const nombreExistente = (esquema.nombre || esquema.nombre_esquema || '').trim().toUpperCase();
            return nombreExistente === nombreMayus;
        });

        if (existe) {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('Ya existe un esquema fiscal registrado con este nombre.');
            } else if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Ya existe un esquema fiscal registrado con este nombre.', false, true, false);
            }
            $('#esquema-input-nombre').focus();
            return;
        }
    }

    // 3. Validar tasa de IVA obligatoria
    if (!iva) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona la tasa de I.V.A. correspondiente.');
        } else if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Selecciona la tasa de I.V.A. correspondiente.', false, true, false);
        }
        return;
    }

    // 4. Consolidar objeto de datos para enviar (cambia la acción según el modo)
    const datosEsquema = {
        accion: esEdicion ? 'actualizar_esquema_fiscal' : 'guardar_esquema_fiscal',
        nombre,
        tasa_iva: iva,
        tasa_ieps: ieps,
        ieps_cuota_litro,
        ieps_cuota_unidad,
        retencion_isr,
        retencion_iva
    };

    if (esEdicion) {
        datosEsquema.id = idEsquema;
    }

    Guardar_Gestion_Esquema_Impuesto(datosEsquema);
});

