<?php
$configModulo = [
    'titulo' => 'Clientes',
    'buscador' => [
        'placeholder' => 'Ingresa el nombre, RFC o código del cliente',
        'id_input' => 'buscador-cliente',
        'id_btn_reset' => 'btn-reset-buscador-cliente'
    ],
];
$tituloPage = $configModulo['titulo'];
ob_start();
?>
<div class="w-p-100">
</div>
<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/principal.modulo.php';
?>
<script src="../../../public/js/variables/clientes.js" ></script>
<script src="../../../public/js/ajax/pages/clientes.js" ></script>

<script src="../../../public/js/components/pages/views/clientes.js" ></script>
