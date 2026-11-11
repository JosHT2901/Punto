<?php
$configModulo = [
    'titulo' => 'Esquemas de Impuestos',
    'buscador' => [
        'placeholder' => 'Ingresa el nombre del perfil de impuesto',
        'id_input' => 'buscador-impuestos',
        'id_btn_reset' => 'btn-reset-buscador-impuestos'
    ],
    'boton_atras' => true,
    'href_atras'=>'ajustes.php'
];
$tituloPage = $configModulo['titulo'];
ob_start();
?>
<?php
// Guardamos todo el HTML anterior en la variable $contenido_protegido
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>
<script src="../../../public/js/variables/impuestos.js" ></script>
<script src="../../../public/js/ajax/pages/impuestos.js" ></script>

<script src="../../../public/js/components/pages/views/impuestos.js" ></script>
