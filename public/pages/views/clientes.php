<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Clientes";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100">
   

</div>
<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>