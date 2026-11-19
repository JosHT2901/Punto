<?php 
include_once "sesion.php"
?>
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
        <div class="w-p-100 h-calc-100-60 flex flex-column flex-1 min-h-0">
            
            <!-- Barra de Acciones Superior (Botones Atrás / Guardar Dinámicos) -->
            <div class="w-p-100 h-50 mb-2 bg-gray-200 flex p-2 items-center box-sizing">
                <div class="flex-1 flex justify-start items-center">
                    <?php if ($mostrarBotonAtras ?? true): ?>
                        <button type="button" class="btn btn-secondary fw-600 flex items-center gap-1" id="<?php echo $idBotonAtras ?? 'btn-atras'; ?>">
                            <i class="icon vf-ic_fluent_arrow_left_24_filled fs-2"></i>
                            <span><?php echo $textoBotonAtras ?? 'Atrás'; ?></span>
                        </button>
                    <?php endif; ?>
                </div>
                <div class="flex-1 flex justify-end items-center">
                    <?php if ($mostrarBotonGuardar ?? true): ?>
                        <button type="button" class="btn btn-primary fw-600" id="<?php echo $idBotonGuardar ?? 'btn-guardar'; ?>">
                            <?php echo $textoBotonGuardar ?? 'Guardar'; ?>
                        </button>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Contenido Dinámico (Aquí se inyectará tu formulario o vista) -->
            <div class="flex-1 min-h-0 flex flex-column overflow-hidden">
                <?php echo $contenido_componente ?? ''; ?>
            </div>
            
        </div>
    </div>

</body>

</html>