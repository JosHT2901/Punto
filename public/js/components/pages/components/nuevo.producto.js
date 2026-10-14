const listaDePasosWizard = [{
        id: 'form-producto-identificacion',
        label: 'Identificación'
    },
    {
        id: 'form-producto-basico',
        label: 'Básico'
    },
    {
        id: 'form-producto-imagenes',
        label: 'Imágenes'
    },
    {
        id: 'form-producto-fiscal',
        label: 'Fiscal'
    },
    {
        id: 'form-producto-compra',
        label: 'Compra'
    },
    {
        id: 'form-producto-costos-equivalencias',
        label: 'Costos'
    },
    {
        id: 'form-producto-precios-venta',
        label: 'Precios'
    },
    {
        id: 'form-producto-atributos',
        label: 'Atributos'
    },
    {
        id: 'form-producto-ubicacion',
        label: 'Ubicación'
    },
    {
        id: 'form-producto-existencias',
        label: 'Existencias'
    },
    {
        id: 'form-producto-codigos',
        label: 'Códigos'
    }
];


$(document).ready(function () {
    let inicializado = false;
    // --- Función Principal InicializarNuevoProducto ---
    function InicializarNuevoProducto() {
        if (inicializado) return;
        inicializado = true;
        Eventos_Generales_Paginas()
        console.log(window.productos)
        InicializarWizardAcordeon(function ($currentCard, $btn) {
            const btnId = $btn.attr('id');
            console.log(btnId)
            // --- PASO 1: IDENTIFICACIÓN ---
            if (btnId === 'identificacion-boton-siguiente') {
                const codigo = $('#input-codigo').val().trim();
                const sku = $('#input-sku').val().trim();

                if (!codigo) {
                    MostrarAlerta('Ingresa el código del producto', 250, false);
                    $('#input-codigo').focus();
                    return false;
                }

                if (!sku) {
                    MostrarAlerta('Ingresa el SKU del producto', 250, false);
                    $('#input-sku').focus();
                    return false;
                }

                // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
                ActualizarTimelineActivo('form-producto-basico');
                window.codigo=codigo
                if (typeof Eventos_Pagina_2 === 'function') Eventos_Pagina_2();
            }

            // --- PASO 2: BÁSICO ---
            if (btnId === 'descripcion-boton-siguiente') {
                const descripcion = $("#producto-input-descripcion").val().trim();
                const marca = CustomSelect.getValue("#select-marcas");
                const categoria = CustomSelect.getValue("#select-categoria");

                console.log(categoria)
                if (!descripcion.length) {
                    MostrarAlerta('Ingresa la descripción del producto', 250, false);
                    $("#producto-input-descripcion").focus();
                    return false;
                }

                if (!categoria) {
                    MostrarAlerta('Selecciona una categoría', 250, false);
                    return false;
                }

                if (!marca) {
                    MostrarAlerta('Selecciona una marca', 250, false);
                    return false;
                }

                // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
                ActualizarTimelineActivo('form-producto-imagenes');
                if (typeof Eventos_Pagina_3 === 'function') Eventos_Pagina_3();
            }

            if (btnId === "imagenes-boton-siguiente") {
                const todasLasImagenes = window.galeriaProductos.getAllData();

                // Validar si es obligatorio subir al menos una imagen (la portada)
                if (todasLasImagenes.length === 0) {
                    MostrarAlerta('Debes subir al menos una imagen del producto', 250, false);
                    return false; // Frena el avance del wizard
                }
                ActualizarTimelineActivo('form-producto-fiscal');
                Eventos_Pagina_4()
            }

            if (btnId === 'fiscal-boton-siguiente') {
                const clave_sat = $("#producto-input-sat").data('id')
                const impuesto = CustomSelect.getValue('select-impuestos')

                if (!clave_sat) {
                    MostrarAlerta('Selecciona una clave de producto', 250, false);
                    return false; // Frena el avance del wizard
                }

                if (!impuesto) {
                    MostrarAlerta('Selecciona un perfil de impuestos', 250, false);
                    return false; // Frena el avance del wizard
                }
                ActualizarTimelineActivo('form-producto-compra');
                Eventos_Pagina_5()
            }

            if (btnId === 'costo-boton-siguiente') {
                const cantidadCompra = parseFloat(String($("#producto-input-cantidad-compra").val()).replace(/,/g, '')) || 0;
                const costoTotal = parseFloat(String($("#producto-input-costo-total").val()).replace(/,/g, '')) || 0;
                const piezasPorEmpaque = parseFloat(String($("#producto-input-piezas-por-empaque").val()).replace(/,/g, '')) || 0;
                const nombreEmpaque = $("#producto-input-tipo-compra").val().trim();
    
                if (!nombreEmpaque) {
                    MostrarAlerta('Ingresa el nombre del empaque', 250, false);
                    return false;
                }
    
                // Validaciones básicas de negocio
                if (cantidadCompra <= 0) {
                    MostrarAlerta('La cantidad comprada debe ser mayor a 0', 250, false);
                    return false;
                }
    
                if (costoTotal <= 0) {
                    MostrarAlerta('El costo total de la compra debe ser mayor a 0', 250, false);
                    return false;
                }
    
                if (piezasPorEmpaque <= 0) {
                    MostrarAlerta('Las piezas por empaque deben ser mayores a 0', 250, false);
                    return false;
                }
    
                // Cálculo correcto del total de piezas (Cantidad de empaques * piezas que trae cada uno)
                const totalPiezas = cantidadCompra * piezasPorEmpaque;
    
                // Definir costos globales y unitarios
                window.costoBaseUnitario = (totalPiezas > 0) ? (costoTotal / totalPiezas) : 0;
                const costoPorEmpaque = (cantidadCompra > 0) ? (costoTotal / cantidadCompra) : 0;
    
                // Inicializar los datos para la tabla de equivalencias del Paso 6
                window.formasVentaData = [{
                    empaque: nombreEmpaque,
                    equivalencia: piezasPorEmpaque,
                    vinculado: true,
                    costoUnitario: costoPorEmpaque
                }];
                Eventos_Pagina_6();
                Eventos_Pagina_7()
            }
            if (btnId === 'formas-boton-siguiente') {
                // Validar si la tabla existe en el DOM antes de procesarla
                const $filas = $('#contenedor-tabla-formas-venta tbody tr');
                if (!$filas.length) {
                    if (typeof MostrarAlerta === 'function') {
                        MostrarAlerta('No se encontraron los niveles de empaque configurados.', 250, false);
                    } else {
                        alert('No se encontraron los niveles de empaque configurados.');
                    }
                    return false;
                }
        
                let hayErrores = false;
                let primerInputIncompleto = null;
        
                // Sincronizamos y validamos cada renglón de la tabla de formas de venta antes de continuar
                $filas.each(function() {
                    const $fila = $(this);
                    const index = $fila.data('index');
                    const $inputEmpaque = $fila.find('.input-empaque');
                    const $inputEquiv = $fila.find('.input-equiv');
                    const $inputCosto = $fila.find('.input-costo-unitario');
            
                    const empaqueVal = $inputEmpaque.val().trim();
                    const equivVal = parseFloat(String($inputEquiv.val()).replace(/,/g, '')) || 0;
                    const costoVal = parseFloat(String($inputCosto.val()).replace(/,/g, '')) || 0;
            
                    if (window.formasVentaData[index]) {
                        window.formasVentaData[index].empaque = empaqueVal;
                        window.formasVentaData[index].equivalencia = equivVal;
                        window.formasVentaData[index].costoUnitario = costoVal;
                    }
            
                    // Validaciones obligatorias por nivel
                    if (!empaqueVal) {
                        hayErrores = true;
                        $inputEmpaque.addClass('is-invalid');
                        if (!primerInputIncompleto) primerInputIncompleto = $inputEmpaque;
                    } else {
                        $inputEmpaque.removeClass('is-invalid');
                    }
            
                    if (equivVal <= 0) {
                        hayErrores = true;
                        $inputEquiv.addClass('is-invalid');
                        if (!primerInputIncompleto) primerInputIncompleto = $inputEquiv;
                    } else {
                        $inputEquiv.removeClass('is-invalid');
                    }
            
                    if (costoVal < 0) {
                        hayErrores = true;
                        $inputCosto.addClass('is-invalid');
                        if (!primerInputIncompleto) primerInputIncompleto = $inputCosto;
                    } else {
                        $inputCosto.removeClass('is-invalid');
                    }
                });
            
                if (hayErrores) {
                    if (typeof MostrarAlerta === 'function') {
                        MostrarAlerta('Por favor completa el nombre del empaque y asegúrate de que las equivalencias y costos sean válidos.', 250, false);
                    } else {
                        alert('Por favor completa todos los campos obligatorios de los niveles de empaque.');
                    }
                    if (primerInputIncompleto) primerInputIncompleto.focus();
                    return false;
                }
            
                console.log("Jerarquía de formas de venta lista para guardar:", window.formasVentaData);
            }
        
            if (btnId === 'empaques-boton-siguiente') {
                // Validar si la tabla de códigos SAT existe en el DOM antes de procesarla
                const $filasSat = $('#contenedor-tabla-codigos-sat tbody tr');
                if (!$filasSat.length) {
                    if (typeof MostrarAlerta === 'function') {
                        MostrarAlerta('No se encontraron los registros de códigos y claves SAT.', 250, false);
                    } else {
                        alert('No se encontraron los registros de códigos y claves SAT.');
                    }
                    return false;
                }
        
                let hayErrores = false;
                let primerInputIncompleto = null;
            
                // Sincronizamos y validamos cada renglón de la tabla en tiempo real antes de continuar
                $filasSat.each(function() {
                    const $fila = $(this);
                    const index = $fila.data('index');
                    const $inputCodigo = $fila.find('.input-codigo');
                    const $inputSat = $fila.find('.input-sat');
            
                    const codigoVal = $inputCodigo.val().trim();
                    const satVal = $inputSat.val().trim();
            
                    if (window.formasVentaData[index]) {
                        window.formasVentaData[index].codigoBarras = codigoVal;
                        window.formasVentaData[index].claveSat = satVal;
                    }
            
                    // Validaciones obligatorias por nivel
                    if (!codigoVal) {
                        hayErrores = true;
                        $inputCodigo.addClass('is-invalid');
                        if (!primerInputIncompleto) primerInputIncompleto = $inputCodigo;
                    } else {
                        $inputCodigo.removeClass('is-invalid');
                    }
            
                    if (!satVal) {
                        hayErrores = true;
                        $inputSat.addClass('is-invalid');
                        if (!primerInputIncompleto) primerInputIncompleto = $inputSat;
                    } else {
                        $inputSat.removeClass('is-invalid');
                    }
                });
            
                if (hayErrores) {
                    if (typeof MostrarAlerta === 'function') {
                        MostrarAlerta('Por favor completa el código de barras y la clave SAT en todos los niveles.', 250, false);
                    } else {
                        alert('Por favor completa el código de barras y la clave SAT en todos los niveles.');
                    }
                    if (primerInputIncompleto) primerInputIncompleto.focus();
                    return false;
                }
            
                // Guardamos formalmente la estructura consolidada en nuestra MemoriaLocal
                if (typeof MemoriaLocal !== 'undefined') {
                    MemoriaLocal.GuardarMasivo('formasVenta', window.formasVentaData);
                }
    
                console.log("Estructura jerárquica de empaques y códigos SAT guardada con éxito:", window.formasVentaData);
                
                // Aquí puedes continuar con la lógica para avanzar al siguiente paso del wizard
            }
        });
        const $inputSku = $("#input-sku");
        const $btnBlock = $("#boton-block-sku");
        const $icono = $btnBlock.find('i');
        ActualizarEstadoSku($inputSku, $btnBlock, $icono, true);
        Eventos_Pagina_1($inputSku, $btnBlock, $icono)
        Eventos_Pagina_5();

        ActualizarTimelineActivo('form-producto-identificacion')
    }

    // Validación inicial por si los datos globales ya están listos al cargar el DOM
    if (window.marcas && window.sku) {
        InicializarNuevoProducto();
    }

    // Escucha robusta cuando los datos carguen de manera asíncrona externa
    $(document).off('datosListos.nuevoProducto').on('datosListos.nuevoProducto', function () {
        InicializarNuevoProducto();
    });
});