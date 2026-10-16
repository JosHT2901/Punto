function renderizarTablaFormasVenta() {
    const cabecerasFormasVenta = [{
            field: 'empaque',
            label: 'Empaque / Nivel',
            width: '35%',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm input-empaque input-mayus" data-index="${index}" value="${valor || ''}" placeholder="Ej. Paquete" autocomplete="off">
            `
        },
        {
            field: 'equivalencia',
            label: 'Piezas que contiene este nivel',
            width: '20%',
            align: 'center',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm text-center input-equiv" data-index="${index}" value="${valor || 1}" min="1">
            `
        },
        {
            field: 'vinculado',
            label: 'Estado',
            width: '15%',
            align: 'center',
            render: (valor, row, index) => {
                let icono = valor ? '<i class="ph ph-link text-primary fs-5"></i>' : '<i class="ph ph-link-break text-danger fs-5"></i>';
                let titulo = valor ? 'Vinculado al costo global (Clic para desvincular)' : 'Desvinculado / Costo Libre (Clic para vincular)';
                let claseBtn = valor ? 'btn-outline-primary' : 'btn-outline-danger';
                return `
                    <button type="button" class="btn btn-sm ${claseBtn} btn-toggle-vinculo rounded-circle p-1" data-index="${index}" title="${titulo}" style="width: 30px; height: 30px;">
                        ${icono}
                    </button>
                `;
            }
        },
        {
            field: 'costoUnitario',
            label: 'Costo Unit. ($)',
            width: '20%',
            align: 'right',
            render: (valor, row, index) => {
                let disabledAttr = row.vinculado ? 'disabled bg-light' : '';
                let numValor = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
                return `
                    <input type="text" step="0.01" class="form-control form-control-sm text-end fw-600 text-secondary input-decimal input-costo-unitario ${disabledAttr}" data-index="${index}" value="${numValor.toFixed(2)}">
                `;
            }
        },
        {
            field: 'acciones',
            label: '',
            width: '10%',
            align: 'center',
            render: (valor, row, index) => {
                // Si es el primer nivel (índice 0), no permitimos mostrar el botón de eliminar
                if (index === 0) {
                    return `<span class="text-muted fs-2" title="Nivel base principal (No se puede eliminar)">Principal</span>`;
                }
                return `
                    <button type="button" class="btn btn-ghost text-danger btn-sm btn-eliminar-nivel p-1 " data-index="${index}" title="Eliminar nivel">
                        <i class="ph ph-trash fs-5"></i>
                    </button>
                `;
            }
        }
    ];

    // Renderizamos la tabla usando TableService pasándole los datos actuales
    TableService.render('contenedor-tabla-formas-venta', cabecerasFormasVenta, window.formasVentaData);

    // Aseguramos agregar el botón de "Agregar Nivel" si no existe en el contenedor superior
    if (!$('#btn-agregar-nivel-formato').length) {
        $(`#contenedor-tabla-formas-venta`).before(`
            <div class="flex justify-between items-center mb-2">
                <span class="fs-3 fw-600 text-dark">Niveles de Empaque y Venta</span>
                <button type="button" class="btn btn-secondary flex items-center gap-1" id="btn-agregar-nivel-formato">
                    <i class="ph ph-plus fs-5"></i> 
                    <span>Agregar nivel</span>
                </button>
            </div>
        `);
    }

    // Evento para agregar un nuevo nivel vacío
    $(document).off('click.agregarNivel', '#btn-agregar-nivel-formato')
        .on('click.agregarNivel', '#btn-agregar-nivel-formato', function () {
            window.formasVentaData.push({
                empaque: '',
                equivalencia: 1,
                vinculado: false,
                costoUnitario: 0.00
            });
            renderizarTablaFormasVenta();
        });

    // Evento para eliminar un nivel protegiendo siempre la primera fila
    $(document).off('click.eliminarNivel', '.btn-eliminar-nivel')
        .on('click.eliminarNivel', '.btn-eliminar-nivel', function () {
            const index = $(this).data('index');

            // Blindaje extra: impedir por código que se elimine el índice 0 bajo ninguna circunstancia
            if (index === 0) {
                console.warn("Intento de eliminar el nivel principal bloqueado.");
                return;
            }

            window.formasVentaData.splice(index, 1);
            renderizarTablaFormasVenta();
        });
}



function renderizarTablaClavesSAT() {
    const cabeceras = [
        {
            field: 'empaque',
            label: 'Empaque / Nivel',
            width: '20%',
            render: (valor) => `<span class="fw-600 text-secondary">${valor || 'Sin nombre'}</span>`
        },
        {
            field: 'equivalencia',
            label: 'Piezas',
            width: '10%',
            align: 'center',
            render: (valor) => `<span class="text-muted">${valor || 1}</span>`
        },
        {
            field: 'codigoBarras',
            label: 'Código de Barras',
            width: '35%',
            render: (valor, row, index) => `
                <div class="flex gap-2 items-center">
                    <input type="text" class="form-control form-control-sm input-codigo" data-index="${index}" value="${valor || ''}" placeholder="Ej. 7501000..." autocomplete="off">
                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-scan-codigo" data-index="${index}" title="Escanear código">
                        <i class="ph vf-ic_fluent_barcode_scanner_24_filled fs-6"></i>
                    </button>
                    <button type="button" class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-codigo-global" data-index="${index}" title="Usar código global">
                        <i class="ph ph-lightning fs-6"></i>
                    </button>
                </div>
            `
        },
        {
            field: 'claveSat',
            label: 'Clave S.A.T.',
            width: '17%',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm input-mayus input-sat" data-index="${index}" value="${valor || ''}" placeholder="Ej.H-87 Pieza" autocomplete="off">
            `
        },
        {
            field: 'unidad',
            label: 'Unidad Medida',
            width: '18%',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm input-mayus input-unidad input-letras" data-index="${index}" value="${valor || ''}" placeholder="Ej. CAJA" autocomplete="off">
            `
        }
    ];

    // Renderizamos la tabla usando TableService con los datos de las formas de venta
    TableService.render('contenedor-tabla-codigos-sat', cabeceras, window.formasVentaData);
}

function renderizarTablaPrecios() {
    const cabecerasPrecios = [{
            field: 'empaque',
            label: 'Empaque / Nivel',
            width: '35%',
            render: (valor) => `<span class="fw-600 text-secondary">${valor || 'Sin nombre'}</span>`
        },
        {
            field: 'costoUnitario',
            label: 'Costo Unit. ($)',
            width: '20%',
            align: 'right',
            render: (valor) => {
                let numValor = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
                return `<span class="fw-600 text-dark">$${numValor.toFixed(2)}</span>`;
            }
        },
        {
            field: 'margenGanancia',
            label: 'Margen de Ganancia (%)',
            width: '20%',
            align: 'center',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm text-center fw-600 input-margen input-decimal" data-index="${index}" value="${valor || 30.00}" placeholder="30" autocomplete="off">
            `
        },
        {
            field: 'precioVenta',
            label: 'Precio de Venta ($)',
            width: '25%',
            align: 'right',
            render: (valor, row, index) => {
                let numPrecio = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
                return `
                    <input type="text" class="form-control form-control-sm text-end fw-700 text-primary input-precio-venta input-decimal" data-index="${index}" value="${numPrecio.toFixed(2)}" placeholder="0.00" autocomplete="off">
                `;
            }
        }
    ];

    // Renderizamos la tabla de precios usando TableService con los datos actualizados
    TableService.render('contenedor-tabla-precios', cabecerasPrecios, window.formasVentaData);
}

function renderizarTablaUbicacion() {
    const cabecerasUbicacion = [
        {
            field: 'nombre', // O el campo que use tu objeto de sucursales para el nombre
            label: 'Sucursal',
            width: '40%',
            render: (valor) => `<span class="fw-600 text-secondary">${valor || 'Sucursal'}</span>`
        },
        {
            field: 'ubicacion',
            label: 'Ubicación / Pasillo / Estante',
            width: '60%',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm input-mayus input-ubicacion" data-index="${index}" value="${valor || ''}" placeholder="Ej. Pasillo 3, Anaquel B" autocomplete="off">
            `
        }
    ];

    // Renderizamos la tabla usando TableService apuntando al contenedor de sectores y consumiendo las sucursales
    TableService.render('contenedor-sectores', cabecerasUbicacion, window.sucursales);
}

function renderizarTablaExistencias() {
    const cabecerasExistencias = [
        {
            field: 'nombre', // Nombre de la sucursal
            label: 'Sucursal',
            width: '34%',
            render: (valor) => `<span class="fw-600 text-secondary">${valor || 'Sucursal'}</span>`
        },
        {
            field: 'existencia',
            label: 'Existencia Actual',
            width: '22%',
            align: 'center',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm text-center fw-600 input-existencia input-decimal" data-index="${index}" placeholder="0" autocomplete="off">
            `
        },
        {
            field: 'stockMinimo',
            label: 'Stock Mínimo',
            width: '22%',
            align: 'center',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm text-center fw-600 input-stock-min input-decimal" data-index="${index}"  placeholder="0" autocomplete="off">
            `
        },
        {
            field: 'stockMaximo',
            label: 'Stock Máximo',
            width: '22%',
            align: 'center',
            render: (valor, row, index) => `
                <input type="text" class="form-control form-control-sm text-center fw-600 input-stock-max input-decimal" data-index="${index}"  placeholder="0" autocomplete="off">
            `
        }
    ];

    // Renderizamos la tabla en el contenedor de existencias usando el arreglo de sucursales
    TableService.render('contenedor-existencias', cabecerasExistencias, window.sucursales);
}