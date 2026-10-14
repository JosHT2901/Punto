function Eventos_Generales_Paginas() {
    InputService.maxLength(".input-100", 100)
    InputService.maxLength(".input-50", 50)
    InputService.aMayusculas(".input-mayus", 100)
}

function Eventos_Pagina_1($inputSku, $btnBlock, $icono) {
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
        $("#input-codigo").val(codigo);
    })

    InputService.maxLength("#input-codigo", 14)
    $("#boton-scan-codigo").off('click').on('click', function (e) {
        CrearVentanaIframe(
            'Escanear código',
            'barcode.php',
            '450px',
            true,
            true
        );
    })

    // Aseguramos limpiar cualquier evento previo para evitar duplicidades
    $("#input-codigo").off('input.validarCodigo').on('input.validarCodigo', function () {
        const $input = $(this);
        const $errorSpan = $input.closest('.flex-column').find('.error-produ-msg');
        const codigoIngresado = $input.val().trim().toUpperCase();

        // Si está vacío, limpiamos errores y salimos
        if (!codigoIngresado) {
            $input.removeClass('border-red-500 text-red-600');
            $errorSpan.text('').hide();
            return;
        }

        // Verificamos si window.productos existe y es un array válido
        if (Array.isArray(window.productos)) {
            // Buscamos si ya existe un producto con el mismo código
            const codigoExistente = window.productos.some(prod =>
                String(prod.Codigo).trim().toUpperCase() === codigoIngresado
            );

            if (codigoExistente) {
                $input.addClass('border-red-500 text-red-600');
                $errorSpan.text('El código de este producto ya se encuentra registrado').show();
            } else {
                // Limpiamos el error visual y ocultamos el span
                $input.removeClass('border-red-500 text-red-600');
                $errorSpan.text('').hide();
            }
        }
    });
}

function Eventos_Pagina_2() {
    PintarSelectCategorias()
    PintarSelectMarcas()
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

function Eventos_Pagina_3() {
    window.galeriaProductos = new ImageGalleryManager('contenedor-galeria-productos', {
        maxFiles: 8
    });
}

function Eventos_Pagina_4() {
    const claves = window.claves_productos.map(item => ({
        id: item.id,
        valor: `${item.id} - ${item.descripcion}`
    }));
    AutocompletarGenerico('#producto-input-sat', claves);
    PintarSelectImpuestos()
}

function Eventos_Pagina_5() {
    // Aplicamos formato decimal solo a los campos que manejan dinero o cantidades con decimales
    InputService.numerosDecimales("#producto-input-cantidad-compra", 3, 'left', 'Ejemplo 12');
    InputService.numerosDecimales("#producto-input-costo-total", 2, 'left', '0.00');
    InputService.numerosDecimales("#producto-input-piezas-por-empaque", 2, 'left', '0.00')
    // Para las piezas por empaque usamos un input numérico entero estándar limpio
    // (o puedes usar un input type="number" / input text sin la restricción estricta de decimales)

    function calcularCostosCompra() {
        // Limpiamos comas por si viene formateado y parseamos correctamente
        const cantidadCompra = parseFloat(String($("#producto-input-cantidad-compra").val()).replace(/,/g, '')) || 0;
        const costoTotal = parseFloat(String($("#producto-input-costo-total").val()).replace(/,/g, '')) || 0;
        const piezasPorEmpaque = parseFloat(String($("#producto-input-piezas-por-empaque").val()).replace(/,/g, '')) || 0;
        const tipoCompra = $("#producto-input-tipo-compra").val().trim() || 'Caja';

        // 1. Actualizar etiqueta dinámica del tipo de unidad (ej. "Caja" o "Paquete")
        $("#label-tipo-unidad").text(tipoCompra);

        // 2. Calcular el total de piezas generales corregido (Cantidad comprada * Piezas por empaque)
        const totalPiezas = cantidadCompra * piezasPorEmpaque;
        $("#producto-input-piezas-compra").val(totalPiezas);

        // 3. Calcular el costo por cada empaque individual (Costo Total / Cantidad Comprada)
        let costoPorEmpaque = 0;
        if (cantidadCompra > 0) {
            costoPorEmpaque = costoTotal / cantidadCompra;
        }
        $("#contador-costo-empaque").text('$' + costoPorEmpaque.toFixed(2));

        // 4. Calcular el costo base por pieza individual (Costo Total / Total de Piezas)
        window.costoBaseUnitario = 0;
        if (totalPiezas > 0) {
            window.costoBaseUnitario = costoTotal / totalPiezas;
        }
        $("#contador-costo-base").text('$' + window.costoBaseUnitario.toFixed(2));
    }

    // Escuchar eventos en tiempo real sobre los inputs de la sección de compras
    $(document).off('input.calcCompra', '#producto-input-cantidad-compra, #producto-input-costo-total, #producto-input-piezas-por-empaque, #producto-input-tipo-compra')
        .on('input.calcCompra', '#producto-input-cantidad-compra, #producto-input-costo-total, #producto-input-piezas-por-empaque, #producto-input-tipo-compra', function () {
            calcularCostosCompra();
        });

    // Ejecutar un cálculo inicial al cargar la página por si hay valores predeterminados
    calcularCostosCompra();
}

function Eventos_Pagina_6() {
    renderizarTablaFormasVenta();
    InputService.numerosDecimales('.input-equiv', 2, 'left', '0.00');
    InputService.numerosDecimales('.input-costo-unitario', 2, 'left', '0.00');

    // 1. Evento para cambiar el nombre del empaque en tiempo real
    $(document).off('input.emp', '#contenedor-tabla-formas-venta .input-empaque')
        .on('input.emp', '#contenedor-tabla-formas-venta .input-empaque', function () {
            const index = $(this).data('index');
            const valor = $(this).val();
            if (window.formasVentaData[index]) {
                window.formasVentaData[index].empaque = valor;
            }
        });

    // 2. Evento para cambiar la equivalencia y recalcular costos vinculados por división
    $(document).off('input.equiv', '#contenedor-tabla-formas-venta .input-equiv')
        .on('input.equiv', '#contenedor-tabla-formas-venta .input-equiv', function () {
            const index = $(this).data('index');
            const valorEquiv = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;

            if (window.formasVentaData[index]) {
                window.formasVentaData[index].equivalencia = valorEquiv;

                // Si está vinculado, calculamos en base a la jerarquía
                if (window.formasVentaData[index].vinculado) {
                    // Si es el primer nivel (Caja), se multiplica la cantidad de piezas por el costo base unitario
                    if (index === 0) {
                        window.formasVentaData[index].costoUnitario = valorEquiv * (window.costoBaseUnitario || 0);
                    } else {
                        // Para niveles subsecuentes, tomamos como referencia el costo unitario del nivel inmediato superior
                        const costoNivelSuperior = (window.formasVentaData[index - 1] && window.formasVentaData[index - 1].costoUnitario) ?
                            window.formasVentaData[index - 1].costoUnitario :
                            (window.costoBaseUnitario || 0);

                        // Dividimos el costo del nivel anterior entre el factor ingresado
                        window.formasVentaData[index].costoUnitario = (valorEquiv > 0) ? (costoNivelSuperior / valorEquiv) : 0;
                    }

                    // Actualizamos visualmente el input de costo de esa misma fila en tiempo real
                    const $fila = $(this).closest('tr');
                    $fila.find('.input-costo-unitario').val(window.formasVentaData[index].costoUnitario.toFixed(2));
                }
            }
        });

    // 3. Evento para alternar el botón de vínculo (Bloqueado/Desbloqueado)
    $(document).off('click.vinculo', '#contenedor-tabla-formas-venta .btn-toggle-vinculo')
        .on('click.vinculo', '#contenedor-tabla-formas-venta .btn-toggle-vinculo', function () {
            const index = $(this).data('index');

            if (window.formasVentaData[index]) {
                window.formasVentaData[index].vinculado = !window.formasVentaData[index].vinculado;

                // Si se vuelve a vincular, recalculamos su costo automáticamente respetando la jerarquía
                if (window.formasVentaData[index].vinculado) {
                    const valorEquiv = window.formasVentaData[index].equivalencia || 0;
                    if (index === 0) {
                        window.formasVentaData[index].costoUnitario = valorEquiv * (window.costoBaseUnitario || 0);
                    } else if (index > 0 && valorEquiv > 0) {
                        const costoNivelSuperior = window.formasVentaData[index - 1] ? window.formasVentaData[index - 1].costoUnitario : 0;
                        window.formasVentaData[index].costoUnitario = costoNivelSuperior / valorEquiv;
                    }
                }

                renderizarTablaFormasVenta();
                Eventos_Pagina_6();
            }
        });

    // 4. Evento para editar manualmente el costo unitario cuando está desvinculado (Costo Libre)
    $(document).off('input.costo', '#contenedor-tabla-formas-venta .input-costo-unitario')
        .on('input.costo', '#contenedor-tabla-formas-venta .input-costo-unitario', function () {
            const index = $(this).data('index');
            const costoManual = parseFloat(String($(this).val()).replace(/,/g, '')) || 0;

            if (window.formasVentaData[index] && !window.formasVentaData[index].vinculado) {
                window.formasVentaData[index].costoUnitario = costoManual;
            }
        });
}

function Eventos_Pagina_7() {
    // 1. Renderizar la tabla basada en los niveles existentes
    renderizarTablaClavesSAT();

    // 2. Preparamos las unidades del SAT para que incluyan el formato "id - nombre" (ej. "H87 - Pieza")
    const unidadesFormateadas = window.unidades.map(item => ({
        ...item,
        // Propiedad combinada corregida con guion separador
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
    // Evento para el botón de escanear código por fila (evitando conflictos con múltiples inputs)
    $(document).off('click.scan', '#contenedor-tabla-codigos-sat .btn-scan-codigo')
        .on('click.scan', '#contenedor-tabla-codigos-sat .btn-scan-codigo', function (e) {
            e.preventDefault();
            const index = $(this).data('index');
            const $fila = $(this).closest('tr');
            const $inputCodigo = $fila.find('.input-codigo');

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
                'barcode.php',
                '450px',
                true,
                true
            );
        });

    // 7. Evento para el botón de usar código general (rayo) por fila
    $(document).off('click.gen', '#contenedor-tabla-codigos-sat .btn-generar-codigo')
        .on('click.generar', '#contenedor-tabla-codigos-sat .btn-generar-codigo', function () {
            const index = $(this).data('index');

            // Tomamos el código general disponible en window.codigo o generamos uno de respaldo
            const codigoGeneral = window.codigo;
            console.log(codigoGeneral)
            if (window.formasVentaData[index]) {
                window.formasVentaData[index].codigoBarras = codigoGeneral;
            }

            // Reflejamos el cambio visualmente en el input de esa fila específica
            const $fila = $(this).closest('tr');
            $fila.find('.input-codigo').val(codigoGeneral);
        });
}