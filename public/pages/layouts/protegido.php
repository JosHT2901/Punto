<!DOCTYPE html>
<html lang="es">

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
        <div class="w-p-100 h-calc-100-60">
            <?php
            echo $contenido_protegido;
            ?>

        </div>
    </div>

</body>

</html>