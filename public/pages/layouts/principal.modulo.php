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
            ?>
        </div>

        <!-- Contenedor Principal de la Página -->
        <div class="w-p-100 h-calc-100-60 flex flex-column flex-1 min-h-0 p-2">

            <!-- Barra de Acciones Superior (Botones Atrás / Guardar Dinámicos) -->
            <div class="w-p-100 h-50 mb-2 bg-gray-200 flex p-2 items-center box-sizing rounded-8">
                <?php
                $botones_modulo
                ?>
            </div>

            <!-- Contenido Dinámico (Aquí se inyectará tu formulario o vista) -->
            <div class="flex-1 min-h-0 flex flex-column overflow-hidden row-gap-1">
                <div class="w-p-100 h-40 flex gap-2">
                    <input type="text" name="codigo_postal" class="w-p-100 h-40 input-mayus" id="crear-cliente-input-codigo-postal" placeholder="Ingresa el código postal" autocomplete="off" maxlength="200">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40"
                        id="crear-cliente-boton-buscar-codigo-postal" title="Buscar código postal">
                        <i class="ph ph-x fs-6"></i>
                    </a>
                </div>
                <div class="w-p-100 h-30 my-1 flex">
                    <div>
                        <a id="f-estado" class="h-30 btn flex items-center rounded-md transition-all cursor-pointer border-1 px-px-10 gap-5 border-white ">
                            <span class="fs-3 fw-600">Estado</span>
                            <i class="icon vf-ic_fluent_caret_down_24_filled h-15 w-15 opacity-60"></i>
                        </a>
                    </div>
                </div>
                <div class="flex-1 flex flex-column">
                    <div class="flex-1 min-h-0 flex flex-column">
                        <div class="w-p-100 h-30 flex col-gap-2">
                            <div class="w-20 flex justify-center items-center">
                                <input type="checkbox" id="check-item-all" class="checkbox-round">
                            </div>
                            <div class="flex-1 position-relative flex">
                                <!-- Primer contador (fondo o estado secundario) -->
                                <span class="rounded-8 bg-brand-soft p-1 px-2 h-30 justify-center items-center text-brand-blue fw-600 position-absolute left-0 top-0"
                                    id="contador-seleccion">2 clientes</span>

                                <!-- Contenedor superior con el segundo contador y el botón -->
                                <div class="bg-gray-200 col-gap-2 w-p-100 position-absolute top-0 left-0 h-p-100 rounded-md flex items-center">

                                    <span class="rounded-8 bg-brand-soft p-1 px-2 h-30 justify-center items-center text-brand-blue fw-600"
                                        id="contador-total">22 clientes</span>

                                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30"
                                        id="crear-cliente-boton-buscar-codigo-postal" title="Buscar código postal">
                                        <i class="vf-ic_fluent_delete_24_filled fs-6"></i>
                                    </a>
                                </div>
                            </div>
                            <div class="flex justify-center items-center">
                                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30"
                                    id="crear-cliente-boton-buscar-codigo-postal" title="Buscar código postal">
                                    <i class="vf-ic_fluent_arrow_sort_24_filled fs-6"></i>
                                </a>
                            </div>
                        </div>
                        <div class="flex-1 min-h-0">

                        </div>
                    </div>
                    <div class="w-p-100 h-40 bg-gray-800 rounded-md flex items-center justify-between px-3">
                        <!-- Contenedor de botones de página -->
                        <div class="flex items-center col-gap-1">
                            <div class="w-30 h-30 bg-warning rounded-3xl flex-center text-white cursor-pointer fw-600 p-0">
                                <span>1</span>
                            </div>
                            <a class="w-30 h-30 bg-gray-200 rounded-3xl flex-center text-gray-500 cursor-pointer fw-600 btn p-0">
                                <span>1</span>
                            </a>
                            <!-- Aquí puedes agregar más números o botones de navegación -->
                        </div>

                        <!-- Selector (ej. registros por página o ir a página) -->
                        <div class="flex items-center">
                            <select name="paginacion" id="select-paginacion" class="h-30 px-2 rounded-md border-0 bg-white">
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>
                <?php echo $contenido_protegido ?? ''; ?>
            </div>

        </div>
    </div>

</body>

</html>