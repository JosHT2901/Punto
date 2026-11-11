<?php

$tituloPage = 'Link expirado';
ob_start();
?>
<div class="w-p-100 flex flex-column">
    <div class="flex justify-center items-center fw-700 fs-5 my-2">
        <span>El enlace ha expirado o no es válido</span>
    </div>
    <div class=" flex justify-center items-center my-3">
        <img src="../../images/broken-link.png" alt="Link expirado" class="h-100">
    </div>
    <div class="flex justify-center items-center fs-3 fw-600 text-center text-gray-500 my-3">
        <span>El código de restablecimiento ha caducado por motivos de seguridad o ya fue utilizado. Por favor, solicita uno nuevo.</span>
    </div>

    <div class="w-p-100 flex mt-4">
        <a href="../views/login.php" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center justify-center w-p-100 h-40" style="text-decoration: none;">
            <span>Volver al inicio de sesión</span>
        </a>
    </div>
</div>
<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_columna = ob_get_clean();

include_once __DIR__ . '/../layouts/columna-400.php';
?>