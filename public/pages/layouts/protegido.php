<?php 
include_once "sesion.php"
?>
<!DOCTYPE html>
<html lang="es" class=" min-w-400 custom-scroll">

<head>
    <meta charset="UTF-8">
    <title><?php echo $tituloPage ?? 'Mi Sistema'; ?></title>
    <!-- Incluimos tus estilos y configuraciones globales -->
    <?php
    include_once __DIR__ . '/../include/include.php';
    include_once __DIR__ . '/../include/script.php';
    include_once __DIR__ . '/../include/modal/script.php';

    ?>
</head>

<body>

    <div class="w-vw-100 h-vh-100">
        <div class="w-p-100 h-50 ">
            <?php
            include_once __DIR__ . "/../include/menu/menu.php";
            include_once __DIR__ . "/../include/menu/lateral.php";
            include_once __DIR__ . "/../include/menu/sesion.php";
            include_once __DIR__ . '/../include/menu/script.php';
            ?>
        </div>
        <div class="w-p-100 h-calc-100-60 p-2 flex flex-column overflow-auto">
            <div class="w-p-100 fw-600 fs-4 p-2 pl-3 my-2 text-gray-700 rounded-8" style="border-left: 6px solid var(--warning);">
                <span><?php echo $tituloPage ?></span>
            </div>
            <div class="flex-1 overflow-auto custom-scroll">
                <?php
                echo $contenido_protegido;
                ?>
            </div>
        </div>
    </div>

</body>

</html>