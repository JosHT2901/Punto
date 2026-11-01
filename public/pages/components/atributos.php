<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de productos, costos y precios";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-gestion-producto">
    <div class="w-p-100 flex js-wizard-container flex-1 min-w-0 ocultar-scroll flex-wrap" id="contenedor-atributos">

        <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
            <div class="my-3 flex flex-column gap-4">
                <!-- Se adapta a columna en móviles y fila en pantallas medianas/grandes -->
                <div class="flex flex-column md:flex-row justify-between gap-3">
                    <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                        <label for="producto-input-codigo" class="block mb-1 fs-3 fw-600 pl-2">Color</label>
                        <div class="flex items-center gap-2">
                            <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 border border-slate-200/80 rounded-2xl min-h-[50px] transition-all" id="contenedor-colores">
                                <!-- Los nuevos colores seleccionados se insertarán aquí dinámicamente -->
                            </div>
                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-abrir-color" id="atributos-nuevo-color">
                                <i class="vf-ic_fluent_add_24_filled fs-6"></i>
                            </a>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                        <label for="producto-input-codigo" class="block mb-1 fs-3 fw-600 pl-2">Peso</label>
                        <div class="flex items-center gap-2">
                            <div class="flex-1 flex flex-wrap items-center">
                                <input>
                            </div>
                            <div class="flex-1 h-40" id="contenedor-select-unidades-kilogramo">

                            </div>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                        <label for="producto-input-codigo" class="block mb-1 fs-3 fw-600 pl-2">Opciones</label>
                        <div class="flex items-center gap-2">
                            <div class="w-p-100 flex flex-column">
                                <div class="w-p-100 h-40 gap-2 flex" id="contenedor-opciones-1"></div>
                                <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 border border-slate-200/80 rounded-2xl min-h-[50px] transition-all" id="mi-contenedor-estatico">
                                    <!-- Los nuevos colores seleccionados se insertarán aquí dinámicamente -->
                                </div>
                            </div>

                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="atributos-nueva-opcion">
                                <i class="vf-ic_fluent_add_24_filled fs-6"></i>
                            </a>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-gray-200 rounded-8" id="contenedor-opciones">
                                <div class="flex-1 flex justify-start items-center fw-600">
                                    <span>La opcion si es check</span>
                                </div>
                                <div class="">
                                    <label class="toggle-switch pointer">
                                        <input type="checkbox" id="crear-cliente-check-razon-social">
                                        <div class="toggle-switch-background">
                                            <div class="toggle-switch-handle"></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                        <label for="producto-input-codigo" class="block mb-1 fs-3 fw-600 pl-2">Calendario</label>
                        <div class="flex items-center gap-2">
                            <div class="flex-1 flex flex-wrap items-center" id="contenedor-calendario">
                                <input>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-end">
                <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="2">Siguiente</button>
            </div>
        </div>

    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/components/pages/components/nuevo.producto/atributos.js" defer></script>
<script src="../../../public/js/ajax/components/helpers/atributos.js"></script>