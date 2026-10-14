<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestionar marcas";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100 h-p-100 py-2 flex flex-column" id="gestionar-marca-contenedor">
    <!-- TOGGLE PARA CAMBIAR ENTRE ÚNICA O MASIVA -->
    <div class="w-p-100 flex p-2 rounded-8 bg-gray-100 my-3" id="gestionar-marca-masivo">
        <div class="flex-1 flex justify-start items-center fw-600">
            <span>Registrar varias marcas</span>
        </div>
        <div>
            <label class="toggle-switch pointer">
                <input type="checkbox" id="gestionar-marcas-check-varias">
                <div class="toggle-switch-background">
                    <div class="toggle-switch-handle"></div>
                </div>
            </label>
        </div>
    </div>

    <!-- CONTENEDOR PRINCIPAL DE FORMULARIOS -->
    <div class="w-p-100 flex flex-column flex-1 min-w-0 ocultar-scroll">

        <!-- VISTA 1: REGISTRO DE UNA SOLA MARCA -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3" id="gestionar-marca-unica">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header cursor-pointer flex items-center">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="marca-input-nombre-unico" class="block mb-1 fs-3 fw-600 pl-2">Nombre de la marca</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus px-3 border-light rounded-sm input-mayus" id="marca-input-nombre-unico" placeholder="Nombre de la marca" autocomplete="off">
                        </div>
                        <span class="error-marca-msg fs-2 text-danger mt-1 pl-2 fw-600" style="display: none;"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- VISTA 2: REGISTRO MASIVO DE MARCAS -->
        <div class="d-none flex flex-column flex-1 min-h-0" id="gestionar-marcas-masivo">
            <div class="w-p-100 flex justify-end items-center p-2 my-3">
                <div class="flex-1 col-gap-2 flex items-center position-relative">
                    <div>
                        <input type="checkbox" id="check-item-all" class="checkbox-round">
                    </div>
                    <div class="flex justify-start items-center fw-600">
                        <span class="rounded-8 bg-brand-soft p-2 text-brand-blue" id="contador-marcas-masivas">0 marcas</span>
                    </div>
                    <div class="position-absolute row-gap-2 top-0 flex d-none bg-gray-100 px-2 rounded-8" style="left: 30px;" id="contenedor-marcas-acciones">
                        <div class="flex justify-start items-center fw-600 flex-1 w-150">
                            <span class="rounded-8 bg-brand-soft p-2 text-brand-blue" id="contador-marcas-acciones">0 marcas</span>
                        </div>
                        <div class="flex justify-center items-center">
                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30" id="gestionar-marcas-btn-eliminar-seleccionadas" title="Eliminar seleccionados">
                                <i class="icon vf-ic_fluent_delete_24_filled fs-6"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="flex justify-center items-center">
                    <button type="button" class="btn btn-primary fw-600" id="btn-agregar-nueva-marca">Agregar</button>
                </div>
            </div>

            <!-- CONTENEDOR DE TARJETAS DINÁMICAS CON SCROLL ACTIVO -->
            <div class="flex-1 min-h-0 overflow-auto custom-scroll flex flex-column gap-2" id="contenedor-lista-marcas">

            </div>
        </div>
    </div>

    <!-- BOTÓN GLOBAL DE GUARDADO -->
    <div class="p-2 bg-gray-200 flex justify-end items-center mt-auto">
        <button type="button" class="btn btn-primary fw-600" id="gestionar-marcas-boton-guardar">Guardar</button>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/gestionar.marcas.js"></script>
<script src="../../../public/js/components/pages/components/gestionar.marcas.js" defer></script>