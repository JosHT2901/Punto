<?php
$configModulo = [
    'titulo' => 'Categorías',
    'boton_atras' => 'true',
    'href_atras' => 'productos.php',
    'buscador' => [
        'placeholder' => 'Ingresa el nombre o descripción de la categoría',
        'id_input' => 'buscador-categoria',
        'id_btn_reset' => 'btn-reset-buscador-categoria'
    ],
];
$tituloPage = $configModulo['titulo'];
ob_start();
?>
<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>
<script src="../../../public/js/ajax/pages/categorias.js"></script>
<script src="../../../public/js/variables/categorias.js"></script>
<script src="../../../public/js/components/pages/views/categorias.js" defer></script>