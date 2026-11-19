window.botonesToolbarConfig = [{
    text: 'Nuevo producto',
    class: 'btn btn-primary fw-600 flex',
    id: 'producto-boton-nuevo',
    icon: 'vf-ic_fluent_add_24_filled',
    onClick: (e, $btn) => {
        window.location.href="nuevo.producto.php"
    }
},
{
    text: 'Importar',
    class: 'btn btn-secondary fw-600 flex',
    id: 'productos-importar',
    icon: 'vf-ic_fluent_arrow_import_24_filled',
    onClick: (e, $btn) => {
    
    }
},
{
    text: 'Categorías',
    class: 'btn btn-secondary fw-600 flex',
    id: 'productos-categorias',
    icon: 'vf-ic_fluent_layer_24_filled',
    onClick: (e, $btn) => {
        window.location.href="categorias.php"
    }
},
{
    text: 'Marcas',
    class: 'btn btn-secondary fw-600 flex',
    id: 'productos-marcas',
    icon: 'vf-ic_fluent_tag_24_filled',
    onClick: (e, $btn) => {
    window.location.href="marcas.php"
    }
},
{
    text: 'Generar Código Variable',
    class: 'btn btn-secondary fw-600 flex items-center gap-2',
    id: 'btn-codigo-variable',
    icon: 'ph ph-barcode',
    onClick: (e, $btn) => {
        // Lógica para productos que requieren peso o medida variable (ej. 2kg, 5m, etc.)
    }
}

];