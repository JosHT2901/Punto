<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title><?php echo $tituloPage ?? 'Sistema'; ?></title>
    <!-- Incluimos tus estilos y configuraciones globales -->
    <?php
    include_once __DIR__ . '/../include/include.php';
    include_once __DIR__ . '/../include/script.php';
    include_once __DIR__ . '/../include/modal/script.php';
    ?>
</head>

<body>

    <div class="w-vw-100 h-vh-100 flex flex-column">
        <!-- Menús del Sistema -->
        <div class="w-p-100">
            <?php
            include_once __DIR__ . "/../include/menu/menu.php";
            include_once __DIR__ . "/../include/menu/lateral.php";
            include_once __DIR__ . "/../include/menu/sesion.php";
            include_once __DIR__ . '/../include/menu/script.php';
            ?>
        </div>

        <!-- Contenedor Principal de la Página -->
        <div class="w-p-100 h-calc-100-60 flex flex-column justify-center items-center flex-1 min-h-0 p-4 text-center">
            <!-- Icono / Ilustración -->
            <div class="mb-3">
                <img src="../../icons/Pixel_Perfect/hand.png" class="w-150 h-auto" alt="Sin acceso">
            </div>

            <!-- Mensaje descriptivo -->
            <div class="mb-4">
                <h3 class="fs-4 fw-700 text-slate-800 m-0">Acceso Restringido</h3>
                <p class="fs-3 text-slate-500 m-0 mt-1">No tienes permiso para entrar a este módulo</p>
            </div>

            <!-- Botón de acción -->
            <div>
                <a href="../../pages/views/index.php" class="btn btn-primary h-40 px-4 rounded-8 flex items-center justify-center gap-2 shadow-sm text-decoration-none">
                    <i class="icon vf-ic_fluent_home_24_filled fs-5"></i>
                    <span class="fs-3 fw-600">Ir al inicio</span>
                </a>
            </div>
        </div>
    </div>
</body>

</html>