$(document).ready(async function () {
    let inicializado = false;

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

        // ==========================================
        // SOPORTE PARA MODO EDICIÓN (Carga de datos)
        // ==========================================
        const esquemaData = window.esquemaSeleccionado || window.esquemaAEditar || null;
        if (esquemaData) {
            // Guardamos el ID en el formulario o en un campo oculto
            $('#form-gestion-esquema-fiscal').data('id-esquema', esquemaData.id || esquemaData.id_esquema);
            
            // Rellenar campos
            $('#esquema-input-nombre').val(esquemaData.nombre || esquemaData.nombre_esquema || '').trigger('input');
            
            // Asignar valor al custom select de IVA
            const tasaIvaVal = esquemaData.tasa_iva || esquemaData.iva;
            if (tasaIvaVal && typeof CustomSelect !== 'undefined') {
                CustomSelect.setValue('#select-iva', parseFloat(tasaIvaVal).toFixed(4));
            }

            $('#esquema-input-ieps').val(esquemaData.tasa_ieps || esquemaData.ieps || '');
            $('#esquema-input-cuota-litro').val(esquemaData.ieps_cuota_litro || esquemaData.cuota_litro || '');
            $('#esquema-input-cuota-unidad').val(esquemaData.ieps_cuota_unidad || esquemaData.cuota_unidad || '');
            $('#esquema-input-ret-isr').val(esquemaData.retencion_isr || esquemaData.ret_isr || '0');
            $('#esquema-input-ret-iva').val(esquemaData.retencion_iva || esquemaData.ret_iva || '0');
            
            // Cambiar título o texto del botón opcionalmente si lo deseas
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
            { id: '#boton-ayuda-ieps', titulo: 'Tasa I.E.P.S. (Ad-valorem)', desc: 'Porcentaje directo sobre el valor del producto (Ej: 8 para 8%).' },
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
    const ieps = $('#esquema-input-ieps').val().trim();
    const ieps_cuota_litro = $('#esquema-input-cuota-litro').val().trim();
    const ieps_cuota_unidad = $('#esquema-input-cuota-unidad').val().trim();
    const retencion_isr = $('#esquema-input-ret-isr').val().trim();
    const retencion_iva = $('#esquema-input-ret-iva').val().trim();

    // 1. Validar nombre vacío
    if (!nombre) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ingresa el nombre del esquema fiscal.', 'warning');
        }
        $('#esquema-input-nombre').focus();
        return;
    }

    // 2. Validar duplicados de nombre
    const nombreMayus = nombre.toUpperCase();
    if (window.esquemas && Array.isArray(window.esquemas)) {
        const existe = window.esquemas.some(esquema => {
            const idEsquemaItem = esquema.id || esquema.id_esquema;
            if (esEdicion && String(idEsquemaItem) === String(idEsquema)) {
                return false;
            }
            const nombreExistente = (esquema.nombre || esquema.nombre_esquema || '').trim().toUpperCase();
            return nombreExistente === nombreMayus;
        });

        if (existe) {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('Ya existe un esquema fiscal registrado con este nombre.');
            }
            $('#esquema-input-nombre').focus();
            return;
        }
    }

    // 3. Validar tasa de IVA obligatoria
    if (!iva) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona la tasa de I.V.A. correspondiente.');
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