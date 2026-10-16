function PintarSelectCategorias() {
    InsertarCustomSelect({
        contenedor: '#contenedor-categoria',
        id: 'select-categoria',
        placeholder: 'Selecciona categoría...',
        opciones: (window.categorias).map(cat => ({
            value: cat.ID,
            text: cat.Nombre // O 'label' / 'nombre' dependiendo de lo que requiera tu función InsertarCustomSelect
        })),
        buscador: true,
        onChange: (valorSeleccionado) => {
            window.categoria_seleccionada=valorSeleccionado
        }
    });
}

function PintarSelectMarcas() {
    // Limpiamos el contenedor antes de volver a insertar para evitar duplicados o conflictos
    $('#contenedor-marcas').empty();

    InsertarCustomSelect({
        contenedor: '#contenedor-marcas',
        id: 'select-marcas',
        placeholder: 'Selecciona marcas...',
        opciones: (window.marcas || []).map(cat => ({
            value: cat.ID || cat.id,
            text: cat.Nombre || cat.nombre
        })),
        buscador: true,
        onChange: (valorSeleccionado) => {
            console.log("Marca seleccionada:", valorSeleccionado);
        }
    });
}

// --- Función auxiliar para manejar el estado visual del SKU ---
function ActualizarEstadoSku($input, $btn, $icono, bloqueado) {
    window.sku_block = bloqueado;

    if (bloqueado) {
        $input.val(window.sku).prop('disabled', true);
        $btn.removeClass('btn-active').attr('title', 'Desbloquear SKU');
        $icono.removeClass('vf-ic_fluent_lock_closed_24_filled').addClass('vf-ic_fluent_lock_open_24_filled');
    } else {
        $input.prop('disabled', false).focus();
        $btn.addClass('btn-active').attr('title', 'Bloquear SKU');
        $icono.removeClass('vf-ic_fluent_lock_open_24_filled').addClass('vf-ic_fluent_lock_closed_24_filled');
    }
}

let galeriaProductos = null;

function InicializarGaleria() {
    // Instanciamos el gestor de galería
    galeriaProductos = new ImageGalleryManager('contenedor-galeria-productos', {
        size: '110px', // Tamaño de las miniaturas
        maxFiles: 8 // Límite máximo de imágenes permitidas
    });
}

function PintarSelectImpuestos() {
    $('#contenedor-impuestos').empty();

    // Función auxiliar para renderizar los detalles en el contenedor correspondiente
    function mostrarDetalleImpuesto(impuesto) {
        const $contenedorInfo =$('#contenedor-informacion-impuesto');
        if (!$contenedorInfo.length) return;

        if (!impuesto) {
            $contenedorInfo.empty();
            return;
        }

        const configuracionCampos = [
            { 
                label: 'Nombre del Perfil', 
                columna: 'nombre' 
            },
            { 
                label: 'Tasa IVA', 
                columna: 'tasa_iva',
                formatter: (val) => `${(parseFloat(val || 0) * 100).toFixed(2)}%`
            },
            { 
                label: 'Tasa IEPS', 
                columna: 'tasa_ieps',
                formatter: (val) => `${(parseFloat(val || 0) * 100).toFixed(2)}%`
            },
            { 
                label: 'Cuota Litro IEPS', 
                columna: 'ieps_cuota_litro',
                formatter: (val) => `${window.ajustes.simbolo_moneda || '$ '}${parseFloat(val || 0).toFixed(4)}`
            },
            { 
                label: 'Cuota Unidad IEPS', 
                columna: 'ieps_cuota_unidad',
                formatter: (val) => `${window.ajustes.simbolo_moneda || '$ '}${parseFloat(val || 0).toFixed(4)}`
            },
            { 
                label: 'Retención IVA', 
                columna: 'retencion_iva',
                formatter: (val) => `${(parseFloat(val || 0) * 100).toFixed(2)}%`
            },
            { 
                label: 'Retención ISR', 
                columna: 'retencion_isr',
                formatter: (val) => `${(parseFloat(val || 0) * 100).toFixed(2)}%`
            }
        ];

        // Renderizamos el HTML utilizando HtmlDetailService
        const htmlDetalle = HtmlDetailService.renderizarCampos(impuesto, configuracionCampos);
        $contenedorInfo.html(htmlDetalle);
    }

    // Si ya existe un impuesto seleccionado previamente, pintamos su detalle de inicio
    if (window.perfil_impuestos && window.impuestoSeleccionadoData) {
        mostrarDetalleImpuesto(window.impuestoSeleccionadoData);
    }

    InsertarCustomSelect({
        contenedor: '#contenedor-impuestos',
        id: 'select-impuestos',
        placeholder: 'Selecciona un perfil de impuestos...',
        opciones: (window.impuestos || []).map(imp => ({
            value: imp.id,
            text: `${imp.nombre} (${(parseFloat(imp.tasa_iva || 0) * 100).toFixed(0)}%)`
        })),
        buscador: true,
        onChange: (valorSeleccionado) => {
            // Guardamos el ID seleccionado globalmente
            window.perfil_impuestos = valorSeleccionado;
    
            // Buscamos y almacenamos el objeto completo del impuesto seleccionado
            const impuestoEncontrado = (window.impuestos || []).find(imp => imp.id == valorSeleccionado);
            window.impuestoSeleccionadoData = impuestoEncontrado || null;
    
            console.log("Impuesto seleccionado ID:", valorSeleccionado);
            console.log("Información completa del impuesto:", window.impuestoSeleccionadoData);

            // Pintamos los detalles en el contenedor visual usando HtmlDetailService
            mostrarDetalleImpuesto(window.impuestoSeleccionadoData);
    
            // Disparamos funciones de cálculo dependientes si existen
            if (typeof calcularCostosCompra === 'function') {
                calcularCostosCompra();
            }
            if (typeof calcularPreciosVenta === 'function') {
                calcularPreciosVenta();
            }
        }
    });
}

function Procesar_Atributos() {
    idCategoriaSeleccionada=window.categoria_seleccionada
    if (!idCategoriaSeleccionada) {
        $('#contenedor-atributos').empty();
        return;
    }

    // 1. Filtramos los atributos que coincidan con la categoría seleccionada
    const atributosFiltrados = window.atributos.filter(item => String(item.ID_Categoria) === String(idCategoriaSeleccionada));

    // 2. Mapeamos a la estructura que requiere AtributoManager
    const atributosMapeados = atributosFiltrados.map(item => ({
        id: item.ID,
        id_categoria: item.ID_Categoria,
        texto: item.Nombre_Atributo,
        tipo: item.Tipo_Dato
    }));

    // 3. Inicializamos AtributoManager para pintarlos en el div wizard
    AtributoManager.init({
        listaAtributos: atributosMapeados,
        contenedor: '#contenedor-atributos'
    });
}

function ActualizarTimelineActivo(idPasodestino) {
    TimelineUI.Renderizar('#contenedor-timeline', listaDePasosWizard, idPasodestino);
}

function calcularPreciosVenta() {
    // 1. Verificamos si el switch de impuestos está activado
    const contieneImpuestos = $('#check-precio-impuestos').is(':checked');
    
    // 2. Obtenemos las tasas directamente del objeto global de selección o buscándolas en window.impuestos
    let tasaIva = 0;
    let tasaIeps = 0;

    if (window.impuestoSeleccionadoData) {
        tasaIva = parseFloat(window.impuestoSeleccionadoData.tasa_iva) || 0;
        tasaIeps = parseFloat(window.impuestoSeleccionadoData.tasa_ieps) || 0;
    } else if (window.perfil_impuestos && Array.isArray(window.impuestos)) {
        const perfilSeleccionado = window.impuestos.find(item => item.id == window.perfil_impuestos);
        if (perfilSeleccionado) {
            tasaIva = parseFloat(perfilSeleccionado.tasa_iva) || 0;
            tasaIeps = parseFloat(perfilSeleccionado.tasa_ieps) || 0;
        }
    }

    $('#contenedor-tabla-precios tbody tr').each(function() {
        const $fila = $(this);
        const index = $fila.data('index');

        const $inputMargen = $fila.find('.input-margen');
        const $inputPrecio = $fila.find('.input-precio-venta');

        // Obtenemos los valores numéricos limpios
        const margenVal = parseFloat(String($inputMargen.val()).replace(/,/g, '')) || 0;
        
        // Obtenemos el costo unitario guardado en el objeto global para este nivel
        const costoUnitario = window.formasVentaData[index]?.costoUnitario || 0;

        // 3. Cálculo del precio base con margen sobre venta: Costo / (1 - (Margen / 100))
        let precioCalculado = 0;
        if (margenVal < 100) {
            precioCalculado = costoUnitario / (1 - (margenVal / 100));
        } else {
            precioCalculado = costoUnitario; // Evita división por cero si el margen es 100% o más
        }

        // 4. Ajuste según si el switch de impuestos está activo y las tasas del perfil seleccionado
        if (contieneImpuestos) {
            // Aplicamos IVA y/o IEPS acumulados según el perfil fiscal
            const factorImpuesto = 1 + tasaIva + tasaIeps;
            precioCalculado = precioCalculado * factorImpuesto;
        }

        // Actualizamos el input de precio de venta en la tabla
        $inputPrecio.val(precioCalculado.toFixed(2));

        // Sincronizamos también con el objeto global en memoria
        if (window.formasVentaData[index]) {
            window.formasVentaData[index].margenGanancia = margenVal;
            window.formasVentaData[index].precioVenta = precioCalculado;
        }
    });

    console.log("Precios recalculados con impuesto seleccionado:", window.impuestoSeleccionadoData, "Tasa IVA:", tasaIva, window.formasVentaData);
}