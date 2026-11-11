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
        <div class="w-p-100 h-calc-100-60 flex flex-column flex-1 min-h-0 p-2">
        <?php if (!empty($configModulo['boton_atras'])): ?>
                    <div class="flex">
                        <a type="button" class="btn btn-secondary fw-600 flex shrink-0 gap-2 items-center" 
                        href="<?php echo $configModulo['href_atras']?>"
                        style="flex-shrink: 0; white-space: nowrap;" id="smtp-boton-guardar">
                            <i class="icon vf-ic_fluent_arrow_left_24_filled fs-5"></i>
                            <span>Atrás</span>
                        </a>
                    </div>
                <?php endif; ?>
            <div class="w-p-100 fw-600 fs-4 p-2 pl-3 my-2 text-gray-700 rounded-8 flex align-items-center justify-content-between" style="border-left: 6px solid var(--warning);">
                <div class="flex-1">
                    <span><?php echo $configModulo['titulo'] ?></span>
                </div>
            </div>
            <!-- Barra de Acciones Superior (Botones Atrás / Guardar Dinámicos) -->
            <div class="w-p-100 h-50 mb-2 bg-gray-200 flex p-2 items-center box-sizing rounded-8 gap-2" id="viewer-toolbar">
            </div>

            <!-- Contenido Dinámico -->
            <div class="flex-1 min-h-0 flex flex-column overflow-hidden row-gap-1" id="contenedor-principal">

                <!-- Buscador / Input -->
                <div class="w-p-100 h-40 flex gap-2">
                    <input type="text" name="codigo_postal" class="w-p-100 h-40 input-mayus" id="<?php echo $configModulo['buscador']['id_input']; ?>"
                        placeholder="<?php echo $configModulo['buscador']['placeholder']; ?>" autocomplete="off" maxlength="200">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40"
                        id="<?php echo $configModulo['buscador']['id_btn_reset']; ?>" title="Limpiar búsqueda">
                        <i class="ph ph-x fs-6"></i>
                    </a>
                </div>

                <!-- Filtros Carrusel -->
                <div class="w-p-100 h-30 my-1 flex" id="contenedor-filtros">
                </div>

                <!-- Resultados -->
                <div class="flex-1 flex flex-column position-relative overflow-auto custom-scroll" id="contenedor-resultados">
                    <div class="flex-1 min-h-0 flex flex-column">

                        <!-- Cabecera de la tabla / lista con checkbox general y barra de selección -->
                        <div class="w-p-100 h-30 flex col-gap-2 px-2">
                            <div class="flex col-gap-3">
                                <div class="w-20 flex justify-center items-center">
                                    <input type="checkbox" id="check-item-all" class="checkbox-round">
                                </div>
                                <div class="w-20 flex justify-center items-center">
                                    <a class="btn w-30 h-30 btn-ghost rounded-md flex-center position-relative" id="btn-menu-seleccion">
                                        <i class="fs-8 vf-ic_fluent_caret_down_24_filled"></i>
                                    </a>
                                </div>
                            </div>

                            <div class="flex-1 position-relative flex items-center h-p-100" id="contenedor-contador">

                                <!-- Contador General Base -->
                                <div class="bg-gray-200 col-gap-2 w-p-100 h-p-100 rounded-md items-center px-2 flex position-absolute top-0 left-0">
                                    <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1" id="contador-total">
                                        0
                                    </span>
                                </div>

                                <!-- Barra Flotante de Selección Masiva -->
                                <div class="bg-gray-200 col-gap-2 w-p-100 h-p-100 rounded-md items-center px-2 flex position-absolute top-0 left-0 z-index-10 d-none" id="barra-seleccion">

                                    <!-- Contador de seleccionados (inyectado por JS) -->
                                    <div id="contador-container" class="flex items-center h-p-100"></div>

                                    <!-- Botones de acciones masivas -->
                                    <div id="acciones-masivas-container" class="flex items-center gap-2 h-p-100"></div>
                                </div>

                            </div>

                            <div class="flex justify-center items-center">
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30"
                                    id="btn-ordenar-registros" title="Ordenar registros">
                                    <i class="vf-ic_fluent_arrow_sort_24_filled fs-6"></i>
                                </a>
                            </div>
                        </div>

                        <!-- Contenedor de Tarjetas -->
                        <div class="flex-1 min-h-0 overflow-auto custom-scroll my-2" id="contenedor-tarjetas">
                        </div>
                    </div>

                    <!-- Paginador -->
                    <div class="w-p-100 h-40 bg-gray-300 flex rounded-md flex items-center justify-between px-3" id="contenedor-paginador">
                    </div>
                </div>

                <?php echo $contenido_protegido ?? ''; ?>
            </div>

        </div>
    </div>
</body>

</html>