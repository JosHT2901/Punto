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
            // Tu lógica cuando cambie la categoría
            console.log("Categoría seleccionada:", valorSeleccionado);
            Procesar_Atributos(valorSeleccionado);
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

function EventosInputs() {
    InputService.soloNumeros("#producto-input-codigo", 'Ingresa el código del producto', 'left')
    InputService.maxLength("#producto-input-codigo", 13)
    InputService.aMayusculas(".input-mayus")
    InputService.maxLength(".input-mayus", 200)
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

    InsertarCustomSelect({
        contenedor: '#contenedor-impuestos',
        id: 'select-impuestos',
        placeholder: 'Selecciona un perfil de impuestos...',
        opciones: (window.impuestos || []).map(imp => ({
            value: imp.id || imp.ID, // Mapea correctamente el id en minúscula
            text: imp.nombre || imp.Nombre // Mapea correctamente el nombre en minúscula
        })),
        buscador: true,
        onChange: (valorSeleccionado) => {
            console.log("Impuesto seleccionado:", valorSeleccionado);
        }
    });
}

function Procesar_Atributos(idCategoriaSeleccionada) {
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