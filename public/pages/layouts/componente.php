<!DOCTYPE html>
<html lang="es" class="w-vw-100 h-p-100 overflow-auto" >

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $tituloPage ?? 'Mi Sistema'; ?></title>
    <!-- Incluimos tus estilos y configuraciones globales -->
    <?php 
    include_once __DIR__ . '/../include/include.php';  
    include_once __DIR__ . '/../include/script.php';
    include_once __DIR__ . '/../include/modal/script.php';
    ?>
</head>

<body class="h-p-100">
    <main class="w-p-100 h-p-100 position-relative">
        <?php
            echo $contenido_componente;
            include_once __DIR__ . '/../include/carga.php';
        ?>

    </main>
</body>

</html>