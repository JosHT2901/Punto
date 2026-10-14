<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de sucursales";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-gestion-sucursal">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">

        <!-- Paso 1: Información básica -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-sucursal-basico">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="sucursal-input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre de la sucursal</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus input-100" id="sucursal-input-nombre" placeholder="Ej. Sucursal Centro" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="select-custom-tipo-sucursal" class="block mb-1 fs-3 fw-600 pl-2">Tipo</label>
                        <div class="flex items-center gap-2 h-40" id="sucursal-wrapper-tipo">
                        </div>
                    </div>
                    <span class="my-1 fw-600 text-danger fs-3" id="sucursal-span-tipo"></span>
                </div>
                <div class="flex justify-end">
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="2" id="sucursal-basica-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 2: Domicilio -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-sucursal-domicilio">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Domicilio</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="sucursal-input-calle" class="block mb-1 fs-3 fw-600 pl-2">Calle</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="calle" class="w-p-100 h-40 input-mayus input-100" id="sucursal-input-calle" placeholder="Ingresa la calle" autocomplete="off">
                        </div>
                    </div>
                    <div class="flex justify-between gap-3">
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="sucursal-input-num-ext" class="block mb-1 fs-3 fw-600 pl-2">Núm. exterior</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="num_exterior" class="w-p-100 h-40 input-number input-5" id="sucursal-input-num-ext" placeholder="Ingresa el número exterior" autocomplete="off" maxlength="5">
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="sucursal-input-num-int" class="block mb-1 fs-3 fw-600 pl-2">Núm. interior</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="num_interior" class="w-p-100 h-40 input-number input-5" id="sucursal-input-num-int" placeholder="Ingresa el número interior (opcional)" autocomplete="off" maxlength="5">
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column flex-1 min-w-0">
                            <label for="sucursal-input-cp" class="block mb-1 fs-3 fw-600 pl-2">Código postal</label>
                            <div class="flex items-center gap-2">
                                <!-- Se ajustó la clase para que sea consistente con el script que usa soloNumeros -->
                                <input type="text" name="codigo_postal" class="w-p-100 h-40 input-number input-5" id="sucursal-input-cp" placeholder="Ingresa el código postal" autocomplete="off" maxlength="5">
                            </div>
                        </div>
                    </div>

                    <div class="row-gap-0 flex flex-column">
                        <label for="select-estado" class="block mb-1 fs-3 fw-600 pl-2">Estado</label>
                        <div class="flex items-center gap-2 h-40" id="contenedor-select-estado">
                        </div>
                    </div>

                    <div class="row-gap-0 flex flex-column">
                        <label for="select-municipio" class="block mb-1 fs-3 fw-600 pl-2">Municipio</label>
                        <div class="flex items-center gap-2 h-40 justify-center" id="contenedor-select-municipio">
                            <span class="rounded-md bg-brand-soft p-2 text-brand fw-600 fs-3">Selecciona un estado</span>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="select-localidad" class="block mb-1 fs-3 fw-600 pl-2">Localidad</label>
                        <div class="flex items-center gap-2 h-40 justify-center" id="contenedor-select-localidad">
                            <span class="rounded-md bg-brand-soft p-2 text-brand fw-600 fs-3">Selecciona un municipio</span>
                        </div>
                    </div>

                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="1">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="3" id="sucursal-domicilio-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 3: Contacto -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-sucursal-contacto">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Contacto</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="sucursal-input-telefono" class="block mb-1 fs-3 fw-600 pl-2">Teléfono</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="telefono" class="w-p-100 h-40 input-mayus" id="sucursal-input-telefono" placeholder="Ingresa un teléfono principal" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="sucursal-input-telefono-adicional" class="block mb-1 fs-3 fw-600 pl-2">Teléfono adicional</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="telefono_adicional" class="w-p-100 h-40 input-mayus" id="sucursal-input-telefono-adicional" placeholder="Ingresa un teléfono adicional" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="sucursal-input-whatsapp" class="block mb-1 fs-3 fw-600 pl-2">WhatsApp</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="whatsapp" class="w-p-100 h-40 input-mayus" id="sucursal-input-whatsapp" placeholder="Ingresa un número de WhatsApp" autocomplete="off">
                        </div>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="2">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="sucursal-contacto-boton-siguiente">Guardar sucursal</button>
                </div>
            </div>
        </div>

    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/ajax/components/gestionar.sucursales.js"></script>
<script src="../../../public/js/components/pages/components/gestionar.sucursales.js" defer></script>