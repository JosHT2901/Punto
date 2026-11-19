<?php
$configModulo = [
    'titulo' => 'Movimientos',
    'boton_atras' => 'true',
    'href_atras' => 'usuarios.php',
    'buscador' => [
        'placeholder' => 'Buscar por usuario, administrador, permiso o acción...',
        'id_input' => 'buscador-movimiento',
        'id_btn_reset' => 'btn-reset-buscador-movimiento'
    ],
];
$tituloPage = $configModulo['titulo'];
ob_start();
?>
<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>
<script src="../../../public/js/ajax/pages/movimientos.js"></script>
<script src="../../../public/js/variables/movimientos.js"></script>
<script src="../../../public/js/components/pages/views/movimientos.js" defer></script>