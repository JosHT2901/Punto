<?php
$configModulo = [
    'titulo' => 'Usuarios',
    'buscador' => [
        'placeholder' => 'Ingresa el nombre, correo o código del usuario',
        'id_input' => 'buscador-usuario',
        'id_btn_reset' => 'btn-reset-buscador-usuario'
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
<script src="../../../public/js/variables/usuarios.js" ></script>
<script src="../../../public/js/ajax/pages/usuarios.js" ></script>

<script src="../../../public/js/components/pages/views/usuarios.js" ></script>
