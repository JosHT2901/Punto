<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de marcas";
$mostrarBotonGuardar = false;
// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>

<div class="w-p-100 h-p-100 py-2 flex flex-column">

</div>

<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>