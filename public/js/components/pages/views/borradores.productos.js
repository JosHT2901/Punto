const BorradoresSelectionController = CrearSeleccionController('Borradores');

$(document).ready(async function () {
    if (window.borradores && Array.isArray(window.borradores)) {
        InicializarListaBorradores();
    }

    // Escucha el evento personalizado exacto que se dispara en el bloque de carga global
    $(document).off('datosListos.gestionBorradores').on('datosListos.gestionBorradores', function () {
        InicializarListaBorradores();
    });
});

function InicializarListaBorradores() {
    if (!window.borradores || window.borradores.length === 0) {
        $('#contenedor-filas').empty();
        $("#contador-borradores").text('0 productos');
        if (typeof Contenedor_No_Resultados === 'function') {
            Contenedor_No_Resultados('No hay borradores', $("#contenedor-cuerpo"));
        }
    } else {
        RenderizarBorradores();
        EventosBorradores();
    }
}

function RenderizarBorradores() {
    const $contenedor = $('#contenedor-filas');
    const $contador = $("#contador-borradores");

    if (!$contenedor.length) return;

    // 1. Mapear cada borrador y cifrar su ID utilizando Cifrar_Payload
    const borradoresConToken = window.borradores.map(element => {
        const token = Cifrar_Payload(`${element.id}`);
        return {
            ...element,
            token
        };
    });

    // 2. Construir el HTML usando los tokens generados
    const htmlBorradores = borradoresConToken.map(element => `
        <div class="w-p-100 bg-white p-3 p-sm-3 my-2 my-sm-3 rounded-8 border border-slate-200 shadow-xs flex items-center justify-between gap-2 gap-sm-3 transition-all hover:border-slate-300 position-relative flex-wrap tarjeta-borrador-item flex-sm-nowrap contenedor-con-boton-oculto">

            <div class="w-20 flex items-center justify-center shrink-0">
                <input type="checkbox" class="checkbox-round check-item" data-id="${element.id}">
            </div>

            <div class="w-40 h-40 w-sm-50 h-sm-50 rounded-8 bg-brand-soft flex items-center justify-center shrink-0 text-brand">
                <i class="vf-ic_fluent_box_24_filled fs-6 fs-sm-8"></i>
            </div>

            <!-- Contenido descriptivo -->
            <div class="flex-1 flex flex-column justify-center min-w-140">
                <span class="fw-700 text-slate-800 fs-2 fs-sm-3 mb-1 text-truncate">${element.nombre}</span>
                <div class="flex items-center gap-1 gap-sm-2 text-slate-500 fs-1 fs-sm-2 fw-500 flex-wrap">
                    <span class="flex items-center gap-1 rounded-8 bg-brand-soft py-1 px-2 px-sm-3 text-brand-blue fw-600">
                        <strong class="text-slate-700">SKU:</strong> ${element.sku}
                    </span>
                    <span class="flex items-center gap-1 rounded-8 bg-brand-soft py-1 px-2 px-sm-3 text-brand-blue fw-600">
                        <strong class="text-slate-700">Código:</strong> ${element.codigo}
                    </span>
                </div>
            </div>

            <!-- Fecha y estado -->
            <div class="shrink-0 flex flex-column items-start items-sm-end justify-center pl-2 pl-sm-3 border-l border-slate-100">
                <span class="fw-600 text-slate-700 fs-2 fs-sm-3">${element.actualizado_at}</span>
            </div>

            <!-- Botones de Acción laterales -->
            <div class="position-absolute right-0 contenedor-boton-oculto d-none top-0 flex justify-center items-center bg-gray-300 p-1 p-sm-2 h-p-100 rounded-r-8 col-gap-1 col-gap-sm-2" style="z-index: 2;">
                <a href="nuevo.producto.php?token=${element.token}" class="btn w-35 h-35 w-sm-40 h-sm-40 btn-ghost rounded-md flex-center position-relative" title="Editar">
                    <i class="fs-6 fs-sm-8 vf-ic_fluent_edit_24_filled"></i>
                </a>
                <a href="javascript:void(0);" onclick="EliminarBorrador(${element.id})" class="btn w-35 h-35 w-sm-40 h-sm-40 btn-ghost rounded-md flex-center position-relative" title="Eliminar">
                    <i class="fs-6 fs-sm-8 vf-ic_fluent_delete_24_filled"></i>
                </a>
            </div>
        </div>
    `).join('');

    // 3. Inserción única al DOM y actualización del contador
    $contenedor.html(htmlBorradores);

    const total = window.borradores.length;
    $contador.text(`${total} producto${total === 1 ? '' : 's'}`);
}

function EventosBorradores() {
    BorradoresSelectionController.init({
        scope: $("#contenedor-cuerpo"),
        checkItemClass: '.check-item',
        tarjetaClass: '.tarjeta-borrador-item',
        claseActiva: 'seleccionada',
        checkAllId: 'check-item-all',
        onChange: (seleccionadas, estado, idModificado) => {
            const cantidad = seleccionadas.size;
            if (cantidad > 0) {
                ImprimirBotonesAcciones();
            } else {
                $("#contenedor-acciones").empty();
            }
        }
    });
}

function ImprimirBotonesAcciones() {
    $("#contenedor-acciones").html(`
        <a class="btn w-30 h-30 btn-ghost rounded-md flex items-center justify-center position-relative" title="Eliminar seleccionados" onclick="EliminarSeleccionadosBorradores()">
            <i class="fs-6 vf-ic_fluent_delete_24_filled text-slate-600"></i>
        </a>
    `);
}

async function EliminarBorrador(id) {
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar borrador',
        texto: `¿Estás seguro de eliminar el borrador seleccionado?`,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 324
    });

    if (!confirmado) {
        return;
    }
    Eliminar_Borrador(id)
}
async function EliminarSeleccionadosBorradores()
{
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar borradores',
        texto: `¿Estás seguro de eliminar los borradores seleccionados?`,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 324
    });

    if (!confirmado) {
        return;
    }
    const seleccionados=BorradoresSelectionController.getSeleccionados()
    Eliminar_Borradores_Masivo(seleccionados)
}