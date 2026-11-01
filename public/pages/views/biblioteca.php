<!DOCTYPE html>
<html lang="es" class="h-vh-100">

<head>
    <meta charset="UTF-8">
    <title>Biblioteca</title>
    <!-- Incluimos tus estilos y configuraciones globales -->
    <?php
    include_once __DIR__ . '/../include/include.php';
    include_once __DIR__ . '/../include/script.php';
    include_once __DIR__ . '/../include/modal/script.php';
    ?>
    <style>
        .tarjeta-drive {
            border: 1px solid #dadce0;
            overflow: hidden;
            transition: all 0.2s ease-in-out;
        }
    </style>
</head>

<body>
    <div class="w-p-100 h-vh-100 flex flex-column">
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

            <!-- Barra de Acciones Superior (Botones Atrás / Guardar Dinámicos) -->
            <div class="w-p-100 h-50 mb-2 bg-gray-200 flex p-2 items-center box-sizing rounded-8 gap-2 shrink-0" id="viewer-toolbar">
            </div>

            <!-- Contenido Dinámico -->
            <div class="flex-1 min-h-0 flex flex-column overflow-hidden row-gap-1" id="contenedor-principal">

                <!-- Buscador / Input -->
                <div class="w-p-100 h-40 flex gap-2 shrink-0">
                    <input type="text" name="busqueda_biblioteca" class="w-p-100 h-40 input-mayus"
                        placeholder="Buscar archivo..." autocomplete="off" maxlength="200" id="buscador-biblioteca">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="btn-reset-buscador-biblioteca" title="Limpiar búsqueda" style="display: none;">
                        <i class="ph ph-x fs-6"></i>
                    </a>
                </div>

                <!-- Filtros Carrusel -->
                <div class="w-p-100 h-30 my-1 flex shrink-0" id="contenedor-filtros">
                </div>

                <!-- Resultados (Añadido flex-1 y min-h-0 para fijar la jerarquía del scroll) -->
                <div class="flex-1 flex flex-column position-relative min-h-0" id="contenedor-resultados">
                    <div class="flex-1 min-h-0 flex flex-column">

                        <!-- Cabecera de la tabla / lista con checkbox general y barra de selección -->
                        <div class="w-p-100 h-30 flex col-gap-2 px-2 shrink-0">

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
                                    <div id="contador-container" class="flex items-center h-p-100">
                                        <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1" id="contador-seleccion">
                                            0
                                        </span>
                                    </div>

                                    <!-- Botones de acciones masivas -->
                                    <div id="acciones-masivas-container" class="flex items-center gap-2 h-p-100">
                                        <a class="btn w-30 h-30 btn-secondary rounded-3xl flex-center" title="Eliminar archivos seleccionados" id="boton-eliminar-seleccionados">
                                            <i class="icon fs-5 vf-ic_fluent_delete_24_filled"></i>
                                        </a>
                                        <a class="btn w-30 h-30 btn-secondary rounded-3xl flex-center" title="Descargar archivos seleccionados" id="boton-descargar-seleccionados">
                                            <i class="icon fs-5 vf-ic_fluent_arrow_down_24_filled"></i>
                                        </a>
                                    </div>
                                </div>

                            </div>

                            <div class="flex justify-center items-center">
                                <a class="btn btn-ghost rounded-l-8 flex-center shrink-0 w-30 h-30"
                                    id="boton-vista-lista" style="border-radius: 0px;">
                                    <i class="vf-ic_fluent_text_bullet_list_ltr_24_filled fs-6"></i>
                                </a>
                                <a class="btn btn-ghost activo rounded-r-8 flex-center shrink-0 w-30 h-30"
                                    id="boton-vista-ventana" style="border-radius: 0px;">
                                    <i class="vf-ic_fluent_grid_24_filled fs-6"></i>
                                </a>
                            </div>
                        </div>

                        <!-- Contenedor Principal Dinámico (Tarjetas o Filas controladas por JS) -->
                        <div class="flex-1 min-h-0 flex overflow-auto custom-scroll p-2 position-relative" id="contenedor-tarjetas">
                        </div>

                        <div class="w-p-100 flex justify-center items-center position-absolute bottom-0 d-none" id="contenedor-cargando">
                            <div class="spinner-cargando"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</body>
<script src="../../../public/js/components/pages/views/biblioteca/subir.archivo.js" defer></script>
<script src="../../../public/js/components/pages/views/biblioteca/servicios.js" defer></script>
<script src="../../../public/js/components/pages/views/biblioteca/renderizado.js" defer></script>
<script src="../../../public/js/variables/biblioteca.js" defer></script>
<script src="../../../public/js/ajax/pages/biblioteca.js"></script>
<script src="../../../public/js/components/pages/views/biblioteca.js" defer></script>

</html>