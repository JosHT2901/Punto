<?php
$configModulo = [
    'titulo' => 'Productos',
    'buscador' => [
        'placeholder' => 'Ingresa la descripción, código o SKU del producto',
        'id_input' => 'buscador-productos',
        'id_btn_reset' => 'btn-reset-buscador-producto'
    ],
];
$tituloPage = $configModulo['titulo'];
ob_start();
?>
<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>
<script src="../../../public/js/variables/productos.js" ></script>
<script src="../../../public/js/ajax/pages/productos.js" ></script>

<script src="../../../public/js/components/pages/views/productos.js" ></script>
