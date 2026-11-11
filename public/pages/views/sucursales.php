<?php
$configModulo = [
    'titulo' => 'Sucursales',
    'buscador' => [
        'placeholder' => 'Ingresa el nombre de la sucursal',
        'id_input' => 'buscador-sucursal',
        'id_btn_reset' => 'btn-reset-buscador-sucursal'
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
<script src="../../../public/js/variables/sucursales.js" ></script>
<script src="../../../public/js/ajax/pages/sucursales.js" ></script>

<script src="../../../public/js/components/pages/views/sucursales.js" ></script>
