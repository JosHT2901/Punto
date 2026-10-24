function Eventos_Generales_Paginas() {
    InputService.maxLength(".input-100", 100)
    InputService.maxLength(".input-50", 50)
    InputService.aMayusculas(".input-mayus", 100)
    InputService.soloLetras(".input-letras", 100)
    InputService.numerosDecimales('.input-decimal', 2, 'left', '0.00');
}

function Eventos_Pagina_Identificacion() {
    const $inputSku = $("#input-sku");
    const $inputCodigo = $("#input-codigo");
    const $btnBlock = $("#boton-block-sku");
    const $icono = $btnBlock.find('i');
    console.log(MemoriaLocal)
    // Restaurar datos guardados previamente en MemoriaLocal
    if (typeof MemoriaLocal !== 'undefined') {
        const datosIdentificacion = MemoriaLocal.ObtenerTodo('identificacion');
        if (datosIdentificacion && datosIdentificacion.length > 0) {
            const guardado = datosIdentificacion[0];
            console.log(guardado.sku)
            $inputCodigo.val(guardado.codigo);
            window.sku=guardado.sku
            $inputSku.val(guardado.sku)
                
        }
    }

    ActualizarEstadoSku($inputSku, $btnBlock, $icono, true);

    $.messenger.off('BARCODE_SCANNED').on('BARCODE_SCANNED', function (data) {
        if (data) {
            $('#input-codigo').val(data).trigger('change');
            if (typeof ModalAPI !== 'undefined') ModalAPI.cerrar();
        }
    });

    $btnBlock.off('click').on('click', function (e) {
        e.preventDefault();
        ActualizarEstadoSku($inputSku, $btnBlock, $icono, !window.sku_block);
    });

    $("#boton-generar-codigo").off('click').on('click', async function () {
        const codigo = await Generar_Codigo_Barras();
        $("#input-codigo").val(codigo).trigger('input');
    });

    InputService.maxLength("#input-codigo", 14);
    InputService.soloNumeros("#input-codigo", 'Ingresa el código del producto', 'left');

    $("#boton-scan-codigo").off('click').on('click', function (e) {
        CrearVentanaIframe(
            'Escanear código',
            '../components/barcode.php',
            '460px',
            true,
            true
        );
    });

    $("#input-codigo").off('input.validarCodigo').on('input.validarCodigo', function () {
        const $input = $(this);
        const $errorSpan = $input.closest('.flex-column').find('.error-produ-msg');
        const codigoIngresado = $input.val().trim().toUpperCase();

        if (!codigoIngresado) {
            $input.removeClass('border-red-500 text-red-600');
            $errorSpan.text('').hide();
            return;
        }

        if (Array.isArray(window.productos)) {
            const codigoExistente = window.productos.some(prod =>
                String(prod.Codigo).trim().toUpperCase() === codigoIngresado
            );

            if (codigoExistente) {
                $input.addClass('border-red-500 text-red-600');
                $errorSpan.text('El código de este producto ya se encuentra registrado').show();
            } else {
                $input.removeClass('border-red-500 text-red-600');
                $errorSpan.text('').hide();
            }
        }
    });
}

function Eventos_Pagina_Informacion_Basica() {
    PintarSelectCategorias();
    PintarSelectMarcas();

    // Restaurar datos guardados previamente en MemoriaLocal
    if (typeof MemoriaLocal !== 'undefined') {
        const datosBasicos = MemoriaLocal.ObtenerTodo('informacionBasica');
        if (datosBasicos && datosBasicos.length > 0) {
            const guardado = datosBasicos[0];
            if (guardado.descripcion) {
                $("#producto-input-descripcion").val(guardado.descripcion);
            }
            if (guardado.id_categoria && typeof CustomSelect !== 'undefined') {
                CustomSelect.setValue("#select-categoria", guardado.id_categoria);
            }
            if (guardado.id_marca && typeof CustomSelect !== 'undefined') {
                CustomSelect.setValue("#select-marcas", guardado.id_marca);
            }
        }
    }

    $("#nuevo-producto-boton-marca").off('click').on('click', function () {
        CrearVentanaIframe(
            'Nueva marca',
            'gestionar.marcas.php',
            '450px',
            true,
            true,
            function (iframeElement) {
                $.messenger.send(iframeElement, 'datos_iniciales', {
                    mostrar_boton_varias: false
                });
            }
        );
    });
}

function Eventos_Pagina_Imagenes() {
    // 1. Inicializamos el gestor de la galería de productos si no existe
    window.galeriaProductos = new ImageGalleryManager('contenedor-galeria-productos', {
        maxFiles: 8
    });

    // 2. Si el usuario regresa y ya hay imágenes guardadas en MemoriaLocal, las restauramos
    if (typeof MemoriaLocal !== 'undefined' && window.galeriaProductos) {
        const imagenesGuardadas = MemoriaLocal.ObtenerTodo('imagenes');
        
        if (imagenesGuardadas && imagenesGuardadas.length > 0) {
            // Mapeamos para extraer las URLs de previsualización (o los objetos completos que espera la galería)
            // Como tu clase acepta un arreglo de URLs en cargarImagenesExistentes o almacena objetos con preview, 
            // validamos si recuperamos objetos con 'preview' o cadenas directas:
            const urlsOImagenes = imagenesGuardadas.map(item => item.preview || item);
            
            if (typeof window.galeriaProductos.cargarImagenesExistentes === 'function') {
                window.galeriaProductos.cargarImagenesExistentes(urlsOImagenes);
            }
        }
    }
}

function Eventos_Pagina_Fiscal() {
    const claves = (window.claves_productos || []).map(item => ({
        id: item.id,
        valor: `${item.id} - ${item.descripcion}`
    }));
    AutocompletarGenerico('#producto-input-sat', claves);
    PintarSelectImpuestos();

    // Restaurar datos guardados previamente en MemoriaLocal
    if (typeof MemoriaLocal !== 'undefined') {
        const datosFiscales = MemoriaLocal.ObtenerTodo('fiscal');
        if (datosFiscales && datosFiscales.length > 0) {
            const guardado = datosFiscales[0];
            if (guardado.clave_sat) {
                $("#producto-input-sat").data('id', guardado.clave_sat);
                // Si tienes una función o texto visual para el input SAT, asignalo aquí también
            }
            if (guardado.perfil_impuesto && typeof CustomSelect !== 'undefined') {
                CustomSelect.setValue('#select-impuestos', guardado.perfil_impuesto);
                window.perfil_impuesto = guardado.perfil_impuesto;
            }
        }
    }
}

function Eventos_Pagina_Costos() {
    InputService.numerosDecimales("#producto-input-cantidad-compra", 3, 'left', 'Ejemplo 12');
    InputService.numerosDecimales("#producto-input-costo-total", 2, 'left', '0.00');
    InputService.numerosDecimales("#producto-input-piezas-por-empaque", 2, 'left', '0.00');

    // Restaurar datos guardados previamente en MemoriaLocal
    if (typeof MemoriaLocal !== 'undefined') {
        const datosCostos = MemoriaLocal.ObtenerTodo('costos');
        if (datosCostos && datosCostos.length > 0) {
            const guardado = datosCostos[0];
            if (guardado.cantidadCompra) $("#producto-input-cantidad-compra").val(guardado.cantidadCompra);
            if (guardado.costoTotal) $("#producto-input-costo-total").val(guardado.costoTotal);
            if (guardado.piezasPorEmpaque) $("#producto-input-piezas-por-empaque").val(guardado.piezasPorEmpaque);
            if (guardado.nombreEmpaque) $("#producto-input-tipo-compra").val(guardado.nombreEmpaque);
            if (guardado.costoBaseUnitario) window.costoBaseUnitario = guardado.costoBaseUnitario;
        }
    }

    function calcularCostosCompra() {
        const cantidadCompra = parseFloat(String($("#producto-input-cantidad-compra").val()).replace(/,/g, '')) || 0;
        let costoTotalBruto = parseFloat(String($("#producto-input-costo-total").val()).replace(/,/g, '')) || 0;
        const piezasPorEmpaque = parseFloat(String($("#producto-input-piezas-por-empaque").val()).replace(/,/g, '')) || 0;
        const tipoCompra = $("#producto-input-tipo-compra").val().trim() || 'Caja';

        const contieneImpuestos = $('#check-precio-impuestos').is(':checked');

        let tasaImpuesto = 0;
        if (contieneImpuestos && window.perfil_impuestos && Array.isArray(window.impuestos)) {
            const perfilSeleccionado = window.impuestos.find(item => item.id == window.perfil_impuestos);
            if (perfilSeleccionado) {
                tasaImpuesto = parseFloat(perfilSeleccionado.tasa_iva) || 0;
            }
        }

        let costoTotalNeto = costoTotalBruto;
        if (contieneImpuestos && tasaImpuesto > 0) {
            costoTotalNeto = costoTotalBruto / (1 + tasaImpuesto);
        }

        $("#label-tipo-unidad").text(tipoCompra);

        // Corrección de operador de multiplicación faltante
        const totalPiezas = cantidadCompra * piezasPorEmpaque;
        $("#producto-input-piezas-compra").val(totalPiezas);

        let costoPorEmpaque = 0;
        if (cantidadCompra > 0) {
            costoPorEmpaque = costoTotalNeto / cantidadCompra;
        }
        $("#contador-costo-empaque").text('$' + costoPorEmpaque.toFixed(2));

        window.costoBaseUnitario = 0;
        if (totalPiezas > 0) {
            window.costoBaseUnitario = costoTotalNeto / totalPiezas;
        }
        $("#contador-costo-base").text('$' + window.costoBaseUnitario.toFixed(2));
    }

    $(document).off('input.calcCompra change.calcCompra', '#producto-input-cantidad-compra, #producto-input-costo-total, #producto-input-piezas-por-empaque, #producto-input-tipo-compra, #check-precio-impuestos')
        .on('input.calcCompra change.calcCompra', '#producto-input-cantidad-compra, #producto-input-costo-total, #producto-input-piezas-por-empaque, #producto-input-tipo-compra, #check-precio-impuestos', function () {
            calcularCostosCompra();
        });

    calcularCostosCompra();
}

function Eventos_Pagina_Formas_Venta() {
    // Si window.formasVentaData está vacío, intentamos recuperarlo de MemoriaLocal
    if ((!window.formasVentaData || window.formasVentaData.length === 0) && typeof MemoriaLocal !== 'undefined') {
        const memoriaFV = MemoriaLocal.ObtenerTodo('formasVenta');
        if (memoriaFV && memoriaFV.length > 0) {
            window.formasVentaData = memoriaFV;
        }
    }

    renderizarTablaFormasVenta();
    InputService.numerosDecimales('.input-equiv', 2, 'left', '0.00');
    InputService.numerosDecimales('.input-costo-unitario', 2, 'left', '0.00');

    $(document).off('input.emp', '#contenedor-tabla-formas-venta .input-empaque')
        .on('input.emp', '#contenedor-tabla-formas-venta .input-empaque', function () {
            const index = $(this).data('index');
            const valor = $(this).val();
            if (window.formasVentaData[index]) {
                window.formasVentaData[index].empaque = valor;
            }
        });

    $(document).off('input.equiv', '#contenedor-tabla-formas-venta .input-equiv')
        .on('input.equiv', '#contenedor-tabla-formas-venta .input-equiv', function () {
            const index = $(this).data('index');
            const valorEquiv = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;

            if (window.formasVentaData[index]) {
                window.formasVentaData[index].equivalencia = valorEquiv;

                if (window.formasVentaData[index].vinculado) {
                    if (index === 0) {
                        window.formasVentaData[index].costoUnitario = valorEquiv * (window.costoBaseUnitario || 0);
                    } else {
                        // Corrección de sintaxis de índice (index - 1)
                        const nivelSuperior = window.formasVentaData[index - 1];
                        const costoNivelSuperior = (nivelSuperior && nivelSuperior.costoUnitario) 
                            ? nivelSuperior.costoUnitario 
                            : (window.costoBaseUnitario || 0);

                        window.formasVentaData[index].costoUnitario = (valorEquiv > 0) ? (costoNivelSuperior / valorEquiv) : 0;
                    }

                    const $fila = $(this).closest('tr');
                    $fila.find('.input-costo-unitario').val(window.formasVentaData[index].costoUnitario.toFixed(2));
                }
            }
        });

    $(document).off('click.vinculo', '#contenedor-tabla-formas-venta .btn-toggle-vinculo')
        .on('click.vinculo', '#contenedor-tabla-formas-venta .btn-toggle-vinculo', function () {
            const index = $(this).data('index');

            if (window.formasVentaData[index]) {
                window.formasVentaData[index].vinculado = !window.formasVentaData[index].vinculado;

                if (window.formasVentaData[index].vinculado) {
                    const valorEquiv = window.formasVentaData[index].equivalencia || 0;
                    if (index === 0) {
                        window.formasVentaData[index].costoUnitario = valorEquiv * (window.costoBaseUnitario || 0);
                    } else if (index > 0 && valorEquiv > 0) {
                        // Corrección de sintaxis de índice (index - 1)
                        const nivelSuperior = window.formasVentaData[index - 1];
                        const costoNivelSuperior = nivelSuperior ? nivelSuperior.costoUnitario : 0;
                        window.formasVentaData[index].costoUnitario = costoNivelSuperior / valorEquiv;
                    }
                }

                renderizarTablaFormasVenta();
                Eventos_Pagina_Formas_Venta();
            }
        });

    $(document).off('input.costo', '#contenedor-tabla-formas-venta .input-costo-unitario')
        .on('input.costo', '#contenedor-tabla-formas-venta .input-costo-unitario', function () {
            const index = $(this).data('index');
            const costoManual = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;

            if (window.formasVentaData[index] && !window.formasVentaData[index].vinculado) {
                window.formasVentaData[index].costoUnitario = costoManual;
            }
        });
}
function Eventos_Pagina_Claves() {
    // 0. Si window.formasVentaData está vacío o incompleto, intentamos recuperarlo de MemoriaLocal
    if ((!window.formasVentaData || window.formasVentaData.length === 0) && typeof MemoriaLocal !== 'undefined') {
        const memoriaFV = MemoriaLocal.ObtenerTodo('formasVenta');
        if (memoriaFV && memoriaFV.length > 0) {
            window.formasVentaData = memoriaFV;
        }
    }

    // 1. Renderizar la tabla basada en los niveles existentes
    renderizarTablaClavesSAT();

    // 2. Preparamos las unidades del SAT para que incluyan el formato "id - nombre" de forma limpia
    const unidadesFormateadas = (window.unidades || []).map(item => ({
        ...item,
        etiquetaSat: `${item.id} - ${item.nombre}`
    }));

    // 3. Activamos el autocompletar apuntando al nuevo campo 'etiquetaSat'
    AutocompletarGenerico('.input-sat', unidadesFormateadas, 'etiquetaSat', false);

    // 4. Evento para capturar el código de barras en tiempo real por cada fila
    $(document).off('input.cb', '#contenedor-tabla-codigos-sat .input-codigo')
        .on('input.cb', '#contenedor-tabla-codigos-sat .input-codigo', function () {
            const index = $(this).data('index');
            const valor = $(this).val();
            if (window.formasVentaData[index]) {
                window.formasVentaData[index].codigoBarras = valor;
            }
        });

    // 5. Evento para capturar la clave SAT seleccionada en tiempo real
    $(document).off('input.satVal', '#contenedor-tabla-codigos-sat .input-sat')
        .on('input.satVal', '#contenedor-tabla-codigos-sat .input-sat', function () {
            const index = $(this).data('index');
            const valor = $(this).val();
            if (window.formasVentaData[index]) {
                window.formasVentaData[index].claveSat = valor;
            }
        });

    // 6. Evento para el botón de escanear código por fila
    $(document).off('click.scan', '#contenedor-tabla-codigos-sat .btn-scan-codigo')
        .on('click.scan', '#contenedor-tabla-codigos-sat .btn-scan-codigo', function (e) {
            e.preventDefault();
            const index = $(this).data('index');
            const $fila =$(this).closest('tr');
            const $inputCodigo =$fila.find('.input-codigo');

            // Escuchamos el mensaje del escáner iframe de forma limpia
            $.messenger.off('BARCODE_SCANNED').on('BARCODE_SCANNED', function (data) {
                if (data) {
                    // Actualizamos el input visual de esta fila específica
                    $inputCodigo.val(data).trigger('change');

                    // Guardamos el valor en el arreglo global de formas de venta
                    if (window.formasVentaData[index]) {
                        window.formasVentaData[index].codigoBarras = data;
                    }

                    if (typeof ModalAPI !== 'undefined') ModalAPI.cerrar();
                }
            });

            // Abrimos la ventana iframe del escáner
            CrearVentanaIframe(
                'Escanear código',
                '../components/barcode.php',
                '460px',
                true,
                true
            );
        });

    // 7. Evento para el botón de usar código global (rayo) por fila
    $(document).off('click.gen', '#contenedor-tabla-codigos-sat .btn-codigo-global')
        .on('click.gen', '#contenedor-tabla-codigos-sat .btn-codigo-global', function (e) {
            e.preventDefault();
            const index = $(this).data('index');

            // Tomamos el código general disponible en window.codigo
            const codigoGeneral = window.codigo || '';
            console.log("Aplicando código global:", codigoGeneral);

            if (window.formasVentaData[index]) {
                window.formasVentaData[index].codigoBarras = codigoGeneral;
            }

            // Reflejamos el cambio visualmente en el input de esa fila específica
            const $fila = $(this).closest('tr');$fila.find('.input-codigo').val(codigoGeneral);
        });
}
function Eventos_Pagina_Precios_Venta() {
    // 0. Si window.formasVentaData está vacío, intentamos recuperarlo de MemoriaLocal
    if ((!window.formasVentaData || window.formasVentaData.length === 0) && typeof MemoriaLocal !== 'undefined') {
        const memoriaFV = MemoriaLocal.ObtenerTodo('formasVenta');
        if (memoriaFV && memoriaFV.length > 0) {
            window.formasVentaData = memoriaFV;
        }
    }

    // 1. Renderizamos la tabla de precios
    renderizarTablaPrecios();

    // 2. Evento en tiempo real al cambiar el margen (evitando duplicidad con .off)
    $(document).off('input.margenPrecios', '.input-margen')
        .on('input.margenPrecios', '.input-margen', function () {
            if (typeof calcularPreciosVenta === 'function') {
                calcularPreciosVenta();
            }
        });

    // 3. Evento al cambiar el switch de impuestos
    $(document).off('change.impuestosPrecios', '#check-precio-impuestos')
        .on('change.impuestosPrecios', '#check-precio-impuestos', function () {
            if (typeof calcularPreciosVenta === 'function') {
                calcularPreciosVenta();
            }
        });
}

function Eventos_Pagina_Ubicacion() {
    // 0. Si window.sucursalesProducto está vacío, intentamos recuperarlo de MemoriaLocal
    if ((!window.sucursalesProducto || Object.keys(window.sucursalesProducto).length === 0) && typeof MemoriaLocal !== 'undefined') {
        const memoriaSucursales = MemoriaLocal.ObtenerTodo('sucursales');
        if (memoriaSucursales && memoriaSucursales.length > 0) {
            window.sucursalesProducto = {};
            memoriaSucursales.forEach(suc => {
                if (suc.sucursal_id) {
                    window.sucursalesProducto[suc.sucursal_id] = suc;
                }
            });
        }
    }

    // 1. Renderizamos la tabla de ubicaciones por sucursal
    renderizarTablaUbicacion();

    // Inicializamos nuestro objeto independiente si no existe
    window.sucursalesProducto = window.sucursalesProducto || {};

    // 2. Vinculamos el evento de escucha en tiempo real para actualizar o crear el objeto independiente
    $(document).off('input.ubicaciones', '#contenedor-sectores .input-ubicacion')
        .on('input.ubicaciones', '#contenedor-sectores .input-ubicacion', function() {
            const index = $(this).data('index');
            const valorUbicacion = $(this).val().trim();
            const sucursalOriginal = window.sucursales && window.sucursales[index] ? window.sucursales[index] : null;

            if (sucursalOriginal) {
                // Obtenemos el identificador único de la sucursal (ej. id o sucursal_id)
                const sucursalId = sucursalOriginal.id || index;

                // Creamos o actualizamos el registro independiente para esta sucursal sin mutar la original
                window.sucursalesProducto[sucursalId] = {
                    ...(window.sucursalesProducto[sucursalId] || {}),
                    sucursal_id: sucursalId,
                    nombreSucursal: sucursalOriginal.nombre || `Sucursal ${index}`,
                    ubicacion: valorUbicacion
                };
            }
        });
}

function Eventos_Pagina_Existencias() {
    // 0. Si window.sucursalesProducto está vacío, intentamos recuperarlo de MemoriaLocal
    if ((!window.sucursalesProducto || Object.keys(window.sucursalesProducto).length === 0) && typeof MemoriaLocal !== 'undefined') {
        const memoriaSucursales = MemoriaLocal.ObtenerTodo('sucursales');
        if (memoriaSucursales && memoriaSucursales.length > 0) {
            window.sucursalesProducto = {};
            memoriaSucursales.forEach(suc => {
                if (suc.sucursal_id) {
                    window.sucursalesProducto[suc.sucursal_id] = suc;
                }
            });
        }
    }

    // 1. Renderizamos la tabla de existencias por sucursal
    renderizarTablaExistencias();

    // Inicializamos nuestro objeto independiente si no existe
    window.sucursalesProducto = window.sucursalesProducto || {};

    // Función auxiliar para asegurar que el registro de la sucursal existe en nuestro objeto independiente
    function asegurarRegistroSucursal(index) {
        const sucursalOriginal = window.sucursales && window.sucursales[index] ? window.sucursales[index] : null;
        if (!sucursalOriginal) return null;

        const sucursalId = sucursalOriginal.id || index;
        if (!window.sucursalesProducto[sucursalId]) {
            window.sucursalesProducto[sucursalId] = {
                sucursal_id: sucursalId,
                nombreSucursal: sucursalOriginal.nombre || `Sucursal ${index}`,
                ubicacion: sucursalOriginal.ubicacion || '',
                existencia: 0,
                stockMinimo: 0,
                stockMaximo: 0
            };
        }
        return sucursalId;
    }

    // 2. Vinculamos los eventos en tiempo real para actualizar el objeto independiente
    $(document).off('input.existencias', '#contenedor-existencias .input-existencia')
        .on('input.existencias', '#contenedor-existencias .input-existencia', function() {
            const index = $(this).data('index');
            const valor = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;
            const sucursalId = asegurarRegistroSucursal(index);

            if (sucursalId) {
                window.sucursalesProducto[sucursalId].existencia = valor;
            }
        });

    $(document).off('input.stockmin', '#contenedor-existencias .input-stock-min')
        .on('input.stockmin', '#contenedor-existencias .input-stock-min', function() {
            const index = $(this).data('index');
            const valor = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;
            const sucursalId = asegurarRegistroSucursal(index);

            if (sucursalId) {
                window.sucursalesProducto[sucursalId].stockMinimo = valor;
            }
        });

    $(document).off('input.stockmax', '#contenedor-existencias .input-stock-max')
        .on('input.stockmax', '#contenedor-existencias .input-stock-max', function() {
            const index = $(this).data('index');
            const valor = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;
            const sucursalId = asegurarRegistroSucursal(index);

            if (sucursalId) {
                window.sucursalesProducto[sucursalId].stockMaximo = valor;
            }
        });
}