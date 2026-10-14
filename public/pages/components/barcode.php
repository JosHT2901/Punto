<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de productos, costos y precios";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100 h-p-100 flex flex-column row-gap-2 p-3" id="bar-code-contenedor-principal">
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/components/pages/components/barcode.js"></script>