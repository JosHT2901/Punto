<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear cliente";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-gestion-cliente">
    <div class="w-p-100 p-2 rounded-16 bg-brand flex text-white my-3">
        <div class=" flex-1 flex justify-start items-center fs-3 fw-600">
            <span>Código de cliente</span>
        </div>
        <div class="fw-600 fs-4 flex justify-end items-center">
            <span id="crear-cliente-span-codigo">---</span>
        </div>
    </div>
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">
        <!-- Paso 1: Información básica -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-cliente-informacion-basica">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex gap-2">
                        <div class="block mb-1 fs-3 fw-600 pl-2 flex-1">
                            <span>Persona moral</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <label class="toggle-switch pointer">
                                <input type="checkbox" id="crear-cliente-check-razon-social">
                                <div class="toggle-switch-background">
                                    <div class="toggle-switch-handle"></div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre (s)</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus input-100 input-alfanumerico" id="crear-cliente-input-nombre" placeholder="Nombre" autocomplete="off" maxlength="200">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-apellido-paterno" class="block mb-1 fs-3 fw-600 pl-2">Apellido paterno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_paterno" class="w-p-100 h-40 input-mayus input-100 input-alfanumerico" id="crear-cliente-input-apellido-paterno" placeholder="Apellido paterno" autocomplete="off" maxlength="200">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-apellido-materno" class="block mb-1 fs-3 fw-600 pl-2">Apellido materno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_materno" class="w-p-100 h-40 input-mayus input-100 input-alfanumerico" id="crear-cliente-input-apellido-materno" placeholder="Apellido materno" autocomplete="off" maxlength="200">
                        </div>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="2" id="crear-cliente-informacion-basica-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 2: Fiscal -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-cliente-informacion-fiscal">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Fiscal</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-rfc" class="block mb-1 fs-3 fw-600 pl-2">R.F.C.</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="rfc" class="w-p-100 h-40 input-mayus input-alfanumerico" id="crear-cliente-input-rfc" placeholder="Ingresa el R.F.C." autocomplete="off" maxlength="13">
                            <div class="flex items-center justify-between px-2 flex flex-column " style="white-space: nowrap;" id="contenedor-check-rfc-generico">
                                <span class="fs-2 fw-600 mr-2">Genérico</span>
                                <label class="toggle-switch pointer mx-1">
                                    <input type="checkbox" id="cliente-input-rfc-generico">
                                    <div class="toggle-switch-background">
                                        <div class="toggle-switch-handle"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-cliente-span-rfc"></span>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Régimen fiscal</label>
                        <div class="flex items-center gap-2 h-40" id="crear-cliente-contenedor-select-regimen">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-codigo-postal" class="block mb-1 fs-3 fw-600 pl-2">Código postal</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="codigo_postal" class="w-p-100 h-40 input-mayus" id="crear-cliente-input-codigo-postal" placeholder="Ingresa el código postal" autocomplete="off" maxlength="200">
                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40"
                                id="crear-cliente-boton-buscar-codigo-postal" title="Buscar código postal">
                                <i class="ph ph-magnifying-glass fs-6"></i>
                            </a>
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-cliente-span-codigo-postal"></span>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="1">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="3" id="crear-cliente-fiscal-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 3: Contacto -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-cliente-contacto">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Contacto</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-telefono" class="block fw-500 mb-1 fs-3 fw-600 pl-2">Teléfono</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="telefono" class="w-p-100 h-40 input-mayus" id="crear-cliente-input-telefono" placeholder="Ingresa un teléfono" autocomplete="off" maxlength="200">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-cliente-span-telefono"></span>
                    </div>

                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-cliente-input-correo" class="block fw-500 mb-1 fs-3 fw-600 pl-2">Correo</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="correo" class="w-p-100 h-40 input-mayus input-100 input-correo" id="crear-cliente-input-correo" placeholder="Ingresa un correo electrónico" autocomplete="off" maxlength="200">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-cliente-span-correo"></span>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="2">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="crear-cliente-contacto-boton-siguiente" data-target-step="4">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 4: Confirma (ID corregido para evitar duplicidad con Contacto) -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-cliente-confirmar">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Confirma</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4" id="crear-cliente-imprimir-detalle">

                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="3">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="crear-cliente-confirmar-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/crear.cliente.js"></script>
<script src="../../../public/js/components/pages/components/crear.cliente.js" defer></script>