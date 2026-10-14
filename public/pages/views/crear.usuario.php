<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear usuario";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100 flex flex-column h-vh-100 overflow-auto justify-center py-4">

    <div class="w-p-100 my-3 overflow-hidden text-white rounded-md flex justify-center items-center bg-brand p-2">
        <span>Crear usuario</span>
    </div>
    <div class="w-p-100 flex-1 min-h-0 overflow-auto ocultar-scroll">
        <?php include_once __DIR__ . '/../components/crear.usuario.php'; ?>
    </div>

    <div class="w-p-100 mt-4 flex justify-end">
        <a class="btn btn-secondary w-p-100 flex flex-center fw-600" id="auth-boton-continuar">
            <span>Iniciar sesión</span>
        </a>
    </div>

</div>

<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_columna = ob_get_clean();

include_once __DIR__ . '/../layouts/columna-400.php';
?>
<script src="../../../public/js/ajax/pages/crear.usuario.js" ></script>
