<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de productos, costos y precios";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>

<div class="w-p-100 h-p-100 py-2 flex flex-column p-2 row-gap-2 overflow-x-hidden">
    <!-- Cabecera explicativa -->
    <div class="w-p-100 bg-brand-soft flex justify-start p-2 rounded-md row-gap-2 flex-column">
        <span class="fw-600 text-brand text-left">Borradores de productos</span>
        <span class="fw-500 text-gray-500 fs-2 text-left">Retoma el registro o edición de los productos que guardaste temporalmente.</span>
    </div>
    <div class="flex-1 flex flex-column" id="contenedor-cuerpo">
        <!-- Barra de selección y contador -->
        <div class="w-p-100 py-3 px-3 px-sm-3 flex items-center justify-between flex-wrap gap-2">
            <!-- Checkbox de selección general -->
            <div class="flex items-center gap-3 h-40">
                <div class="flex items-center justify-center">
                    <input type="checkbox" id="check-item-all" class="checkbox-round">
                </div>
                <div class="flex items-center" id="contenedor-acciones">
                </div>
            </div>

            <!-- Indicador o contador -->
            <div class="flex items-center justify-center">
                <span class="rounded-8 bg-brand-soft py-1 px-3 text-brand-blue fw-600 fs-2" id="contador-borradores">2 productos</span>
            </div>
        </div>

        <!-- Listado de borradores -->
        <div class="w-p-100 flex flex-column custom-scroll overflow-auto flex-1" id="contenedor-filas">
            
        </div>
    </div>
    <!-- Pie de página adaptable -->
    <div class="w-p-100 bg-gray-300 rounded-8 p-2 flex items-center justify-between flex-wrap gap-2">
        <div class="flex-1 flex justify-start items-center fw-600 text-left min-w-180 p-2">
            <span class="fs-3 fs-sm-3">o también puedes crear un nuevo borrador</span>
        </div>
        <div class="w-p-100 w-sm-auto flex justify-end">
            <a class="h-40 min-w-100 px-3 flex justify-center justify-sm-start items-center rounded-md btn btn-primary
            fw-600 w-p-100 w-sm-auto" href="nuevo.producto.php">
                <i class="vf-ic_fluent_add_24_filled fs-5 w-20 h-20"></i>
                <span class="fs-3">Crear nuevo</span>
            </a>
        </div>
    </div>
</div>

<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.php';
?>
<script src="../../../public/js/ajax/pages/borradores.productos.js"></script>
<script src="../../../public/js/components/pages/views/borradores.productos.js" defer></script>