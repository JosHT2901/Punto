const CategoriasSelectionController = CrearSeleccionController('GestionMarcas');

$(document).ready(function (e) {
    function InicilizarGestionarCategorias() {
        console.log("Atributos cargados:", window.atributos);
        const $contenedor =$("#categorias-contenedor-tabla");
        
        // Verificamos si hay atributos para precargar (Modo Edición)
        const listaAtributosExistentes = window.atributos?.lista_atributos || window.atributos?.atributos || [];
        
        if (listaAtributosExistentes.length > 0) {
            // Limpiamos el contenedor y creamos la estructura de la tabla
            $contenedor.html(`
                <div class="flex h-40 gap-2 align-items-center px-2">
                    <div class="w-30 flex justify-center items-center">
                        <input type="checkbox" id="check-item-all" class="checkbox-round">
                    </div>
                    <div class="flex-1 flex justify-start items-center px-2">
                        <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Nombre del atributo</span>
                    </div>
                    <div class="w-200 flex justify-center items-center">
                        <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Tipo del atributo</span>
                    </div>
                </div>
                <div class="flex-1 min-h-100 overflow-auto custom-scroll" id="contenedor-lista-atributos">
                </div>
            `);

            // Iteramos e insertamos cada atributo existente
            listaAtributosExistentes.forEach((attr, idx) => {
                AgregarNuevoAtributoCategoria({
                    id: attr.id || (idx + 1),
                    nombre: attr.nombre || attr.nombre_atributo || '',
                    tipo: attr.tipo || attr.tipo_atributo || 'texto'
                });
            });
        } else if (typeof Contenedor_Agregar === 'function') {
            Contenedor_Agregar('Agrega un atributo', $contenedor);
        }

        InputService.aMayusculas('.input-mayus');
        
        CategoriasSelectionController.init({
            scope: $contenedor,
            checkItemClass: '.check-item',
            tarjetaClass: '.tarjeta-atributo-item',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: (seleccionadas, estado, idModificado) => {
                console.log("Seleccionadas:", seleccionadas);
                const cantidad = seleccionadas.size;
                const textoPlural = `${cantidad} atributo${cantidad !== 1 ? 's' : ''}`;

                const $panelAcciones =$("#contenedor-atributos-acciones");
                const $contadorTexto =$("#contador-atributos-acciones");

                if (cantidad > 0) {
                    $panelAcciones.css("display", "flex");
                    $contadorTexto.text(textoPlural);
                } else {
                    $panelAcciones.hide();$contadorTexto.text('0');
                }
            }
        });
    }

    if (window.atributos) {
        InicilizarGestionarCategorias();
    }

    $(document).on('datosListos', function () {
        InicilizarGestionarCategorias();
    });
});

// Variables globales de control para atributos
window.numero_atributos = 0;
window.total_atributos_activos = 0;

/**
 * Agrega un nuevo atributo o carga uno existente si se pasan datos.
 * @param {Object|null} datosExistentes Objeto con { id, nombre, tipo } para edición.
 */
function AgregarNuevoAtributoCategoria(datosExistentes = null) {
    if ($("#contenedor-agregar").length > 0) {
        $("#contenedor-agregar").remove();
        $("#categorias-contenedor-tabla").html(`
            <div class="flex h-40 gap-2 align-items-center px-2">
                <div class="w-30 flex justify-center items-center">
                    <input type="checkbox" id="check-item-all" class="checkbox-round">
                </div>
                <div class="flex-1 flex justify-start items-center px-2">
                    <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Nombre del atributo</span>
                </div>
                <div class="w-200 flex justify-center items-center">
                    <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Tipo del atributo</span>
                </div>
            </div>
            <div class="flex-1 min-h-100 overflow-auto custom-scroll" id="contenedor-lista-atributos">
            </div>
        `);
    }

    window.numero_atributos = (window.numero_atributos || 0) + 1;
    window.total_atributos_activos = (window.total_atributos_activos || 0) + 1;

    const indiceActual = datosExistentes?.id || window.numero_atributos;
    const nombreValor = datosExistentes?.nombre || '';
    const tipoValor = datosExistentes?.tipo || 'texto';
    const idSelectCustom = `select-tipo-atributo-${indiceActual}-${Date.now()}`;

    let htmlTarjeta = `
        <div class="w-p-100 my-2 bg-gray-100 p-2 rounded-8 box-sizing flex align-items-center gap-1 tarjeta-atributo-item shrink-0 border-light animate-fade-in contenedor-con-boton-oculto position-relative">
            <div class="h-40 flex w-p-100">
                <div class="h-p-100 flex justify-center items-center w-30">
                    <input type="checkbox" name="atributo_seleccionado[]" data-id="${indiceActual}" class="checkbox-round check-item" value="${indiceActual}">
                </div>

                <div class="flex-1 flex justify-center items-center px-2">
                    <input type="text" name="atributos[${indiceActual}][nombre]" value="${nombreValor}" class="w-p-100 h-p-100 input-mayus px-3 border-light rounded-sm" placeholder="Ej: Color, Talla, Peso" autocomplete="off" required>
                </div>

                <div class="w-200 flex justify-center items-center h-p-100" id="wrapper-select-${indiceActual}">
                </div>
                
                <input type="hidden" name="atributos[${indiceActual}][tipo]" id="input-hidden-tipo-${indiceActual}" value="${tipoValor}">
                
                <div class="flex justify-center items-center px-5 rounded-r-8 position-absolute right-0 top-0 bg-gray-100 w-40 h-p-100 contenedor-boton-oculto d-none">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-35 h-35 boton-eliminar-tarjeta-atributo" title="Eliminar atributo">
                        <i class="icon vf-ic_fluent_delete_24_filled fs-6"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    let $contenedor =$("#contenedor-lista-atributos");
    $contenedor.append(htmlTarjeta);

    const catalogoCrudo = window.atributos?.catalogo_tipos_datos || window.atributos || [];
    const opcionesCatalogo = catalogoCrudo.map((item) => {
        const val = item.codigo || item.value;
        return {
            value: val,
            text: item.etiqueta || item.text,
            selected: String(val) === String(tipoValor)
        };
    });

    InsertarCustomSelect({
        contenedor: `#wrapper-select-${indiceActual}`,
        id: idSelectCustom,
        placeholder: 'Selecciona tipo...',
        opciones: opcionesCatalogo,
        buscador: true,
        onChange: function (valorSeleccionado) {
            $(`#input-hidden-tipo-${indiceActual}`).val(valorSeleccionado);
        }
    });

    const totalActual = window.total_atributos_activos;
    $("#contador-atributos").text(`${totalActual} atributo${totalActual !== 1 ? 's' : ''}`);

    if (typeof CategoriasSelectionController !== 'undefined' && typeof CategoriasSelectionController.sincronizarDOM === 'function') {
        CategoriasSelectionController.sincronizarDOM();
    }

    $contenedor.stop().animate({
        scrollTop: $contenedor[0].scrollHeight
    }, 300);
}

$(document).on('click', '#btn-agregar-atributo', function (e) {
    e.preventDefault();
    AgregarNuevoAtributoCategoria();
});

// 1. Evento para eliminar una tarjeta / atributo individual
$(document).on('click', '.boton-eliminar-tarjeta-atributo', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $tarjeta =$(this).closest('.tarjeta-atributo-item');
    
    $tarjeta.fadeOut(200, function () {$(this).remove();

        window.total_atributos_activos = Math.max(0, (window.total_atributos_activos || 1) - 1);
        const totalActual = window.total_atributos_activos;
        
        $("#contador-atributos").text(`${totalActual} atributo${totalActual !== 1 ? 's' : ''}`);

        if (typeof CategoriasSelectionController !== 'undefined' && typeof CategoriasSelectionController.sincronizarDOM === 'function') {
            CategoriasSelectionController.sincronizarDOM();
        }

        if ($('.tarjeta-atributo-item').length === 0) {
            const $contenedor =$("#categorias-contenedor-tabla");
            if (typeof Contenedor_Agregar === 'function') {
                Contenedor_Agregar('Agrega un atributo', $contenedor);
            }
            $("#contenedor-atributos-acciones").hide();
        }
    });
});

// 2. Evento para eliminar los elementos seleccionados masivamente desde el panel flotante
$(document).on('click', '#btn-eliminar-atributos-seleccionados', async function (e) {
    e.preventDefault();

    const $tarjetasSeleccionadas =$('.tarjeta-atributo-item.seleccionada');

    if ($tarjetasSeleccionadas.length === 0) {
        MostrarAlerta("No hay atributos seleccionados para eliminar.");
        return;
    }

    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar atributos',
        texto: `¿Estás seguro de eliminar ${$tarjetasSeleccionadas.length} atributo(s) seleccionado(s)?`,
        icono: 'vf-ic_fluent_question_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 324
    });

    if (!confirmado) {
        return;
    }

    $tarjetasSeleccionadas.fadeOut(200, function () {$(this).remove();

        const cantidadEliminadas = $tarjetasSeleccionadas.length;
        window.total_atributos_activos = Math.max(0, (window.total_atributos_activos || 0) - cantidadEliminadas);
        const totalActual = window.total_atributos_activos;

        $("#contador-atributos").text(`${totalActual} atributo${totalActual !== 1 ? 's' : ''}`);
        $("#contenedor-atributos-acciones").hide();

        if (typeof CategoriasSelectionController !== 'undefined' && typeof CategoriasSelectionController.sincronizarDOM === 'function') {
            CategoriasSelectionController.sincronizarDOM();
        }

        if ($('.tarjeta-atributo-item').length === 0) {
            const $contenedor =$("#categorias-contenedor-tabla");
            if (typeof Contenedor_Agregar === 'function') {
                Contenedor_Agregar('Agrega un atributo', $contenedor);
            }
        }
    });
});

$(document).on('click', '#btn-guardar-categoria', function (e) {
    e.preventDefault();

    // Validamos el nombre de la categoría usando el input especificado
    const nombre_categoria = $("#crear-categoria-input-nombre").val().toUpperCase();
    
    if (!nombre_categoria) {
        MostrarAlerta('Ingresa el nombre de la categoría', 220, true);
        if ($("#crear-categoria-input-nombre").is("input, textarea")) {
            $("#crear-categoria-input-nombre").focus();
        }
        return;
    }

    // Validar si la categoría ya existe localmente en window.categorias (evitar duplicados en cliente)
    if (window.categorias && Array.isArray(window.categorias)) {
        const idActualEditando = window.id_categoria_a_editar || null;
        const yaExiste = window.categorias.some(cat => {
            const catNombre = (cat.Nombre || cat.nombre_categoria || "").trim().toUpperCase();
            const catId = cat.ID || cat.id || cat.id_categoria;
            return catNombre === nombre_categoria && String(catId) !== String(idActualEditando);
        });

        if (yaExiste) {
            MostrarAlerta('La categoría ingresada ya se encuentra registrada.', 240, true);
            return;
        }
    }

    const totalAtributos = window.total_atributos_activos || 0;
    if (totalAtributos === 0 || $('.tarjeta-atributo-item').length === 0) {
        MostrarAlerta("Debes agregar al menos un atributo para la categoría.");
        return;
    }

    let formularioValido = true;
    $('.tarjeta-atributo-item').each(function () {
        const $inputNombre = $(this).find('input[name*="[nombre]"]');
        if (!$inputNombre.val() || !$inputNombre.val().trim()) {
            formularioValido = false;
            $inputNombre.focus();
            return false;
        }
    });

    if (!formularioValido) {
        MostrarAlerta("Por favor, completa el nombre de todos los atributos.");
        return;
    }

    const atributosArray = [];
    $('.tarjeta-atributo-item').each(function () {
        const $tarjeta = $(this);
        
        // Obtenemos el nombre mediante el input estructurado
        const nombre = $tarjeta.find('input[name*="[nombre]"]').val().trim();
        
        // Obtenemos el tipo directamente del input oculto que actualiza tu CustomSelect
        const tipo = $tarjeta.find('input[name*="[tipo]"]').val() || 'texto';
        
        // Obtenemos el id del checkbox de la tarjeta
        const checkboxId = $tarjeta.find('.check-item').data('id') || null;
        
        atributosArray.push({
            id: checkboxId, 
            nombre: nombre,
            tipo: tipo.toLowerCase().trim()
        });
    });

    const datosPayload = {
        tipo: window.id_categoria_a_editar ? 'editar' : 'crear',
        id_categoria: window.id_categoria_a_editar || null,
        nombre_categoria: nombre_categoria,
        atributos: atributosArray
    };

    // Llamada a tu función de guardado
    if (typeof Guardar_Gestion_Categorias === 'function') {
        Guardar_Gestion_Categorias(datosPayload);
    } else {
        console.error("La función Guardar_Gestion_Categorias no está definida.");
    }
});
