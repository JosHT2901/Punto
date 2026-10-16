function Validacion_Identificacion() {
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

    // Actualizamos el estado global en variables de ventana
    window.codigo = codigo;
    window.sku = sku;

    // Guardamos formalmente en MemoriaLocal usando un contexto adecuado
    if (typeof MemoriaLocal !== 'undefined') {
        // Opción A: Guardarlo como un objeto dentro de un contexto de producto/identificación
        if (typeof MemoriaLocal.GuardarMasivo === 'function') {
            MemoriaLocal.GuardarMasivo('identificacion', [
                { id: 1, codigo: codigo, sku: sku }
            ]);
        }
    }

    console.log("Identificación guardada en memoria:", MemoriaLocal.VerMemoria());

    // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-basico');
    }
    if (typeof Eventos_Pagina_Informacion_Basica === 'function') {
        Eventos_Pagina_Informacion_Basica();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Informacion_Basica() {
    const descripcion = $("#producto-input-descripcion").val().trim();
    const marca = CustomSelect.getValue("#select-marcas");
    const categoria = CustomSelect.getValue("#select-categoria");

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

    // Actualizamos variables globales de apoyo si es necesario
    window.descripcion = descripcion;
    window.marca = marca;
    window.categoria = categoria;

    // Guardamos utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('informacionBasica', [
            { 
                id: 1, 
                descripcion: descripcion, 
                id_marca: marca, 
                id_categoria: categoria 
            }
        ]);
    }

    console.log("Información básica guardada en memoria:", MemoriaLocal.VerMemoria());

    // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-imagenes');
    }
    if (typeof Eventos_Pagina_Imagenes === 'function') {
        Eventos_Pagina_Imagenes();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Imagenes() {
    const todasLasImagenes = window.galeriaProductos && typeof window.galeriaProductos.getAllData === 'function' 
        ? window.galeriaProductos.getAllData() 
        : [];

    // Validar si es obligatorio subir al menos una imagen (la portada)
    if (todasLasImagenes.length === 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Debes subir al menos una imagen del producto', 250, false);
        } else {
            alert('Debes subir al menos una imagen del producto');
        }
        return false; // Frena el avance del wizard
    }

    // Guardamos de forma masiva utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('imagenes', todasLasImagenes);
    }

    console.log("Imágenes guardadas en memoria:", MemoriaLocal.VerMemoria());

    // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-fiscal');
    }
    if (typeof Eventos_Pagina_Fiscal === 'function') {
        Eventos_Pagina_Fiscal();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Fiscal() {
    const clave_sat = $("#producto-input-sat").data('id');
    const impuesto = CustomSelect.getValue('#select-impuestos');

    if (!clave_sat) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona una clave de producto SAT válida', 250, false);
        }
        $("#producto-input-sat").focus();
        return false; // Frena el avance del wizard
    }

    if (!impuesto) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Selecciona un perfil de impuestos', 250, false);
        }
        return false; // Frena el avance del wizard
    }

    // Actualizamos variable global de apoyo
    window.perfil_impuesto = impuesto;

    // Guardamos de forma masiva utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('fiscal', [
            {
                id: 1,
                clave_sat: clave_sat,
                perfil_impuesto: impuesto,
                impuesto_data: window.impuestoSeleccionadoData || null
            }
        ]);
    }

    console.log("Datos fiscales guardados en memoria:", MemoriaLocal.VerMemoria());

    // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-costos');
    }
    if (typeof Eventos_Pagina_Costos === 'function') {
        Eventos_Pagina_Costos();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Costo() {
    const cantidadCompra = parseFloat(String($("#producto-input-cantidad-compra").val()).replace(/,/g, '')) || 0;
    const costoTotal = parseFloat(String($("#producto-input-costo-total").val()).replace(/,/g, '')) || 0;
    const piezasPorEmpaque = parseFloat(String($("#producto-input-piezas-por-empaque").val()).replace(/,/g, '')) || 0;
    const nombreEmpaque = $("#producto-input-tipo-compra").val().trim();

    if (!nombreEmpaque) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Ingresa el nombre del empaque', 250, false);
        }
        $("#producto-input-tipo-compra").focus();
        return false;
    }

    // Validaciones básicas de negocio
    if (cantidadCompra <= 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('La cantidad comprada debe ser mayor a 0', 250, false);
        }
        $("#producto-input-cantidad-compra").focus();
        return false;
    }

    if (costoTotal <= 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('El costo total de la compra debe ser mayor a 0', 250, false);
        }
        $("#producto-input-costo-total").focus();
        return false;
    }

    if (piezasPorEmpaque <= 0) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Las piezas por empaque deben ser mayores a 0', 250, false);
        }
        $("#producto-input-piezas-por-empaque").focus();
        return false;
    }

    // Cálculo correcto del total de piezas (Cantidad de empaques * piezas que trae cada uno)
    const totalPiezas = cantidadCompra * piezasPorEmpaque;

    // Definir costos globales y unitarios
    window.costoBaseUnitario = (totalPiezas > 0) ? (costoTotal / totalPiezas) : 0;
    const costoPorEmpaque = (cantidadCompra > 0) ? (costoTotal / cantidadCompra) : 0;

    // Inicializar los datos para la tabla de equivalencias
    window.formasVentaData = [{
        empaque: nombreEmpaque,
        equivalencia: piezasPorEmpaque,
        vinculado: true,
        costoUnitario: costoPorEmpaque
    }];

    // Guardamos utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('costos', [
            {
                id: 1,
                cantidadCompra: cantidadCompra,
                costoTotal: costoTotal,
                piezasPorEmpaque: piezasPorEmpaque,
                nombreEmpaque: nombreEmpaque,
                costoBaseUnitario: window.costoBaseUnitario,
                formasVentaData: window.formasVentaData
            }
        ]);
    }

    console.log("Costos guardados en memoria:", MemoriaLocal.VerMemoria());

    // Si pasa la validación, actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-formas-venta');
    }
    if (typeof Eventos_Pagina_Formas_Venta === 'function') {
        Eventos_Pagina_Formas_Venta();
    }
    Guardar_Borrador_Producto()
    return true;
}
function Validacion_Formas_Venta() {
    // Validar si la tabla existe en el DOM antes de procesarla
    const $filas = $('#contenedor-tabla-formas-venta tbody tr');
    if (!$filas.length) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('No se encontraron los niveles de empaque configurados.', 250, false);
        }
        return false;
    }

    let hayErrores = false;
    let primerInputIncompleto = null;

    // Sincronizamos y validamos cada renglón de la tabla de formas de venta antes de continuar
    $filas.each(function () {
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
        }
        if (primerInputIncompleto) primerInputIncompleto.focus();
        return false;
    }

    // Guardamos de forma masiva utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('formasVenta', window.formasVentaData || []);
    }

    console.log("Formas de venta guardadas en memoria:", MemoriaLocal.VerMemoria());

    // Actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-claves');
    }

    if (typeof Eventos_Pagina_Claves === 'function') {
        Eventos_Pagina_Claves();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Claves() {
    const $filasSat =$('#contenedor-tabla-codigos-sat tbody tr');
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

    // Obtenemos el código global por si algún nivel viene vacío
    const codigoGlobal = (window.codigo || '').trim();

    // Inicializamos o aseguramos el array global de formas de venta
    window.formasVentaData = window.formasVentaData || [];

    // Sincronizamos y validamos cada renglón de la tabla en tiempo real
    $filasSat.each(function () {
        const $fila =$(this);
        const index = $fila.data('index');
        const $inputCodigo =$fila.find('.input-codigo');
        const $inputSat =$fila.find('.input-sat');
        const $inputUnidad =$fila.find('.input-unidad');

        let codigoVal = $inputCodigo.val().trim();
        const satVal = $inputSat.data('id');
        const unidadVal = $inputUnidad.val().trim();

        // Si el input de código está vacío, usamos el código global por defecto
        if (!codigoVal && codigoGlobal) {
            codigoVal = codigoGlobal;
            $inputCodigo.val(codigoGlobal);
        }

        // Aseguramos que exista el objeto en el índice correspondiente
        if (!window.formasVentaData[index]) {
            window.formasVentaData[index] = {};
        }

        // Sincronizamos únicamente los datos de empaque / formas de venta
        window.formasVentaData[index].codigoBarras = codigoVal;
        window.formasVentaData[index].claveSat = satVal;
        window.formasVentaData[index].unidad = unidadVal;
        // Mantenemos el nombre de la presentación/empaque si ya lo traía
        window.formasVentaData[index].empaque = window.formasVentaData[index].empaque || $fila.find('.presentacion-nombre').text().trim();

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
            MostrarAlerta('Por favor completa el código de barras (o define uno global) y la clave SAT en todos los niveles.', 250, false);
        } else {
            alert('Por favor completa el código de barras y la clave SAT en todos los niveles.');
        }
        if (primerInputIncompleto) primerInputIncompleto.focus();
        return false;
    }

    // 1. Guardamos en el ítem de memoria independiente para formas de venta
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('formasVenta', window.formasVentaData || []);
    }

    console.log("Estructura de empaques y códigos SAT guardada con éxito:", MemoriaLocal.VerMemoria());

    if (typeof Eventos_Pagina_Precios_Venta === 'function') {
        Eventos_Pagina_Precios_Venta();
        calcularPreciosVenta();
    }

    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-precios');
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Precios() {
    const $filasPrecios =$('#contenedor-tabla-precios tbody tr');
    if (!$filasPrecios.length) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('No se encontraron los niveles de precios configurados.', 250, false);
        } else {
            alert('No se encontraron los niveles de precios configurados.');
        }
        return false;
    }

    let hayErrores = false;
    let primerInputIncompleto = null;

    // Preparamos el array independiente para los niveles de precios
    window.preciosData = [];

    // Capturamos el estado del switch de impuestos de los precios de costo
    const incluyeImpuestos = $('#check-precio-impuestos').is(':checked') ? 1 : 0;

    // Sincronizamos y validamos cada renglón de la tabla de precios
    $filasPrecios.each(function () {
        const $fila =$(this);
        const index = $fila.data('index');
        const $inputMargen =$fila.find('.input-margen');
        const $inputPrecio =$fila.find('.input-precio-venta');
        const nivelNombre = $fila.find('.nivel-precio-nombre').text().trim() || ('Nivel ' + (index + 1));

        const margenVal = parseFloat(String($inputMargen.val()).replace(/,/g, '')) || 0;
        const precioVal = parseFloat(String($inputPrecio.val()).replace(/,/g, '')) || 0;

        // Poblamos el array independiente `preciosData` incluyendo la bandera de impuestos
        window.preciosData.push({
            nivel: nivelNombre,
            margen: margenVal,
            precio: precioVal,
            contiene_impuestos: incluyeImpuestos // Guardamos si los costos/precios contemplan impuestos
        });

        // Validaciones obligatorias por nivel
        if (precioVal <= 0) {
            hayErrores = true;
            $inputPrecio.addClass('is-invalid');
            if (!primerInputIncompleto) primerInputIncompleto = $inputPrecio;
        } else {
            $inputPrecio.removeClass('is-invalid');
        }

        if (margenVal < 0) {
            hayErrores = true;
            $inputMargen.addClass('is-invalid');
            if (!primerInputIncompleto) primerInputIncompleto = $inputMargen;
        } else {
            $inputMargen.removeClass('is-invalid');
        }
    });

    if (hayErrores) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Por favor asegúrate de que los precios de venta sean mayores a 0 en todos los niveles.', 250, false);
        } else {
            alert('Por favor asegúrate de que los precios de venta sean mayores a 0 en todos los niveles.');
        }
        if (primerInputIncompleto) primerInputIncompleto.focus();
        return false;
    }

    // 2. Guardamos en el ítem de memoria independiente para los niveles de precios
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('precios', window.preciosData || []);
    }

    console.log("Estructura de precios, márgenes e impuestos guardada con éxito:", MemoriaLocal.VerMemoria());

    // Actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-atributos');
    }

    if (typeof Procesar_Atributos === 'function') {
        Procesar_Atributos();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Atributos() {
    // 1. Obtenemos todos los valores estructurados utilizando AtributoManager
    const atributosValidados = typeof AtributoManager !== 'undefined' && typeof AtributoManager.obtenerValores === 'function' ?
        AtributoManager.obtenerValores() :
        [];

    let hayErrores = false;
    let campoInvalido = null;

    // 2. Validaciones obligatorias y estrictas por tipo de atributo
    for (const attr of atributosValidados) {
        // Validación para campos de texto, números, textareas o tipos que requieren medida
        if ((attr.tipo === 'texto' || attr.tipo === 'numero' || attr.tipo === 'textarea' || attr.tipo === 'longitud' || attr.tipo === 'peso' || attr.tipo === 'volumen') &&
            (!attr.valor || String(attr.valor).trim() === '')) {
            hayErrores = true;
            campoInvalido = attr.etiqueta || 'Atributo';
            break;
        }

        // Si el tipo requiere unidad (ej. longitud, peso, volumen), validamos que tenga valor y unidad seleccionada
        if ((attr.tipo === 'longitud' || attr.tipo === 'peso' || attr.tipo === 'volumen') &&
            (!attr.valor || String(attr.valor).trim() === '' || !attr.unidad || String(attr.unidad).trim() === '')) {
            hayErrores = true;
            campoInvalido = `${attr.etiqueta} (Falta el valor o la unidad)`;
            break;
        }

        // Validación para listas de selección únicas o múltiples vacías
        if ((attr.tipo === 'seleccion' || attr.tipo === 'seleccion_multiple') &&
            (!attr.valor || (Array.isArray(attr.valor) && attr.valor.length === 0))) {
            hayErrores = true;
            campoInvalido = attr.etiqueta || 'Lista de selección';
            break;
        }

        // Validación para selectores de color vacíos
        if (attr.tipo === 'color' && (!attr.valor || (Array.isArray(attr.valor) && attr.valor.length === 0))) {
            hayErrores = true;
            campoInvalido = attr.etiqueta || 'Selector de Color';
            break;
        }
    }

    if (hayErrores) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta(`Por favor completa el atributo obligatorio "${campoInvalido}".`, 250, false);
        } else {
            alert(`Por favor completa el atributo obligatorio "${campoInvalido}".`);
        }
        return false;
    }

    // 3. Sincronizamos en el estado global
    window.atributosSeleccionados = atributosValidados;

    // 4. Guardamos formalmente utilizando el contexto requerido por MemoriaLocal.GuardarMasivo
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('atributos', window.atributosSeleccionados || []);
    }

    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.VerMemoria === 'function') {
        console.log("Atributos guardados en memoria:", MemoriaLocal.VerMemoria());
    }

    // 5. Actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-ubicacion'); 
    }

    if (typeof Eventos_Pagina_Ubicacion === 'function') {
        Eventos_Pagina_Ubicacion();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Ubicaciones() {
    const $filasUbicacion = $('#contenedor-sectores tbody tr');

    // Inicializamos nuestro objeto independiente si no existe
    window.ubicacionesProducto = window.ubicacionesProducto || {};

    if ($filasUbicacion.length) {
        $filasUbicacion.each(function () {
            const $fila = $(this);
            const index = $fila.data('index');
            const $inputUbicacion = $fila.find('.input-ubicacion');
            const ubicacionVal = $inputUbicacion.val().trim();

            // Buscamos la sucursal original asegurando compatibilidad con minúsculas o mayúsculas (ID)
            const sucursalOriginal = window.sucursales && window.sucursales[index] ? window.sucursales[index] : null;
            
            // Evaluamos de forma robusta cualquier variante del ID
            const sucursalId = sucursalOriginal?.id || sucursalOriginal?.ID || sucursalOriginal?.sucursal_id || $fila.data('sucursal-id') || index;

            if (sucursalId !== undefined && sucursalId !== null) {
                window.ubicacionesProducto[sucursalId] = {
                    sucursal_id: sucursalId,
                    ubicacion: ubicacionVal
                };
            }
        });
    }

    // Convertimos el objeto consolidado en un arreglo limpio para guardarlo y enviarlo
    const ubicacionesPayload = Object.values(window.ubicacionesProducto);

    // Guardamos en el ítem de memoria independiente 'ubicaciones'
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('ubicaciones', ubicacionesPayload);
    }

    console.log("Ubicaciones de sucursales guardadas exitosamente:", ubicacionesPayload);

    // Actualizamos el timeline y cargamos los eventos del siguiente paso
    if (typeof ActualizarTimelineActivo === 'function') {
        ActualizarTimelineActivo('form-producto-existencias');
    }
    if (typeof Eventos_Pagina_Existencias === 'function') {
        Eventos_Pagina_Existencias();
    }
    Guardar_Borrador_Producto()
    return true;
}

function Validacion_Existencias() {
    const $filasExistencias = $('#contenedor-existencias tbody tr');
    if (!$filasExistencias.length) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('No se encontraron los registros de existencias por sucursal.', 250, false);
        } else {
            alert('No se encontraron los registros de existencias por sucursal.');
        }
        return false;
    }

    let hayErrores = false;
    let primerInputIncompleto = null;

    window.existenciasProducto = window.existenciasProducto || {};

    // Sincronizamos y validamos cada renglón de la tabla de existencias
    $filasExistencias.each(function () {
        const $fila = $(this);
        const index = $fila.data('index');
        const $inputExistencia = $fila.find('.input-existencia');
        const $inputStockMin = $fila.find('.input-stock-min');
        const $inputStockMax = $fila.find('.input-stock-max');

        const existenciaVal = parseFloat(String($inputExistencia.val()).replace(/,/g, '')) || 0;
        const stockMinVal = parseFloat(String($inputStockMin.val()).replace(/,/g, '')) || 0;
        const stockMaxVal = parseFloat(String($inputStockMax.val()).replace(/,/g, '')) || 0;

        // Validaciones básicas de negocio (evitar valores negativos)
        if (existenciaVal < 0 || stockMinVal < 0 || stockMaxVal < 0) {
            hayErrores = true;
            if (existenciaVal < 0) {
                $inputExistencia.addClass('is-invalid');
                if (!primerInputIncompleto) primerInputIncompleto = $inputExistencia;
            }
            if (stockMinVal < 0) {
                $inputStockMin.addClass('is-invalid');
                if (!primerInputIncompleto) primerInputIncompleto = $inputStockMin;
            }
            if (stockMaxVal < 0) {
                $inputStockMax.addClass('is-invalid');
                if (!primerInputIncompleto) primerInputIncompleto = $inputStockMax;
            }
        } else {
            $inputExistencia.removeClass('is-invalid');
            $inputStockMin.removeClass('is-invalid');
            $inputStockMax.removeClass('is-invalid');
        }

        const sucursalOriginal = window.sucursales && window.sucursales[index] ? window.sucursales[index] : null;
        
        // Evaluamos de forma robusta cualquier variante del ID
        const sucursalId = sucursalOriginal?.id || sucursalOriginal?.ID || sucursalOriginal?.sucursal_id || $fila.data('sucursal-id') || index;

        if (sucursalId !== undefined && sucursalId !== null) {
            window.existenciasProducto[sucursalId] = {
                sucursal_id: sucursalId,
                existencia: existenciaVal,
                stockMinimo: stockMinVal,
                stockMaximo: stockMaxVal
            };
        }
    });

    if (hayErrores) {
        if (typeof MostrarAlerta === 'function') {
            MostrarAlerta('Por favor verifica que las existencias y stocks no contengan valores negativos.', 250, false);
        } else {
            alert('Por favor verifica que las existencias y stocks no contengan valores negativos.');
        }
        if (primerInputIncompleto) primerInputIncompleto.focus();
        return false;
    }

    // Convertimos el objeto consolidado en un arreglo limpio
    const existenciasPayload = Object.values(window.existenciasProducto);

    // Guardamos en el ítem de memoria independiente 'existencias'
    if (typeof MemoriaLocal !== 'undefined' && typeof MemoriaLocal.GuardarMasivo === 'function') {
        MemoriaLocal.GuardarMasivo('existencias', existenciasPayload);
    }

    console.log("Existencias y stocks de sucursales guardados con éxito:", existenciasPayload);

    const payloadCompleto = MemoriaLocal.VerMemoria();
    Guardar_Borrador_Producto()
    Guardar_Gestion_Producto(payloadCompleto);
    
    return true;
}