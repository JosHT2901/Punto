<?php
$tituloPage = 'Empresa';
ob_start();
?>
<div class="w-p-100 overflow-auto">
    <form class="w-p-100 h-p-100 p-3 flex flex-column overflow-auto" id="form-gestion-empresa">

        <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">

            <!-- Paso 1: Información básica y fiscal -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-empresa-informacion-basica">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                    <span>Información Fiscal</span>
                </div>
                <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-razon-social" class="block mb-1 fs-3 fw-600 pl-2">Razón social</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="razon_social" class="w-p-100 h-40 input-mayus input-100 input-alfanumerico" id="empresa-input-razon-social" placeholder="Ingresa la razón social" autocomplete="off" maxlength="250" required>
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-rfc" class="block mb-1 fs-3 fw-600 pl-2">R.F.C.</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="rfc" class="w-p-100 h-40 input-mayus input-alfanumerico" id="empresa-input-rfc" placeholder="Ingresa el R.F.C." autocomplete="off" maxlength="13" required>
                            </div>
                            <span class="my-1 fw-600 text-danger fs-3" id="empresa-span-rfc"></span>
                        </div>
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-regimen" class="block mb-1 fs-3 fw-600 pl-2">Régimen fiscal</label>
                            <div class="flex items-center gap-2 h-40" id="empresa-contenedor-select-regimen">
                                <!-- Select de régimen fiscal cargado dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paso 2: Domicilio -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-empresa-domicilio">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                    <span>Domicilio Fiscal</span>
                </div>
                <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-calle" class="block mb-1 fs-3 fw-600 pl-2">Calle</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="calle" class="w-p-100 h-40 input-mayus" id="empresa-input-calle" placeholder="Nombre de la calle" autocomplete="off" maxlength="150">
                            </div>
                        </div>
                        <div class="row-gap-0 flex gap-3">
                            <div class="flex-1">
                                <label for="empresa-input-num-ext" class="block mb-1 fs-3 fw-600 pl-2">Número exterior</label>
                                <input type="text" name="numero_exterior" class="w-p-100 h-40 input-mayus input-numero-calle input-100" id="empresa-input-num-ext" placeholder="Núm. Ext." autocomplete="off" maxlength="30">
                            </div>
                            <div class="flex-1">
                                <label for="empresa-input-num-int" class="block mb-1 fs-3 fw-600 pl-2">Número interior</label>
                                <input type="text" name="numero_interior" class="w-p-100 h-40 input-mayus input-numero-calle input-100" id="empresa-input-num-int" placeholder="Núm. Int. (Opcional)" autocomplete="off" maxlength="30">
                            </div>
                        </div>
                        <div class="row-gap-0 flex gap-3">
                            <div class="flex-1">
                                <label class="block mb-1 fs-3 fw-600 pl-2">Estado</label>
                                <div class="flex items-center gap-2 h-40" id="contenedor-select-estado">
                                    <!-- Select de estado cargado dinámicamente -->
                                </div>
                            </div>

                            <div class="flex-1">
                                <label class="block mb-1 fs-3 fw-600 pl-2">Municipio / Alcaldía</label>
                                <div class="flex items-center gap-2 h-40" id="contenedor-select-municipio">
                                    <!-- Select de municipio cargado dinámicamente -->
                                </div>
                            </div>
                        </div>
                        <div class="row-gap-0 flex gap-3">
                            <div class="flex-1">
                                <label for="empresa-input-colonia" class="block mb-1 fs-3 fw-600 pl-2">Localidad</label>
                                <div class="flex items-center gap-2 h-40" id="contenedor-select-localidad">
                                    <!-- Select de localidad / colonia cargado dinámicamente -->
                                </div>
                            </div>
                            <div class="flex-1">
                                <label class="block mb-1 fs-3 fw-600 pl-2">Código postal</label>
                                <div class="flex items-center gap-2 justify-center">
                                    <span class="w-p-100 h-40 flex items-center text-center justify-center p-2 bg-gray-50 border rounded text-gray-700 fw-700" id="empresa-span-codigo-postal">---</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paso 3: Contacto -->
            <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-empresa-contacto">
                <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                    <span>Contacto y Medios</span>
                </div>
                <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
                    <div class="my-3 flex flex-column gap-4">
                        <div class="row-gap-0 flex gap-2">
                            <div class="flex-1">
                                <label for="empresa-input-telefono" class="block mb-1 fs-3 fw-600 pl-2">Teléfono principal</label>
                                <div class="flex items-center gap-2">
                                    <input type="text" name="telefono" class="w-p-100 h-40" id="empresa-input-telefono" placeholder="Teléfono principal" autocomplete="off" maxlength="15">
                                </div>
                            </div>
                            <div class="flex-1">
                                <label for="empresa-input-telefono-adicional" class="block mb-1 fs-3 fw-600 pl-2">Teléfono adicional</label>
                                <div class="flex items-center gap-2">
                                    <input type="text" name="telefono_adicional" class="w-p-100 h-40" id="empresa-input-telefono-adicional" placeholder="Teléfono secundario" autocomplete="off" maxlength="15">
                                </div>
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-correo" class="block mb-1 fs-3 fw-600 pl-2">Correo electrónico</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="correo" class="w-p-100 h-40 input-100 input-correo input-mayus" id="empresa-input-correo" placeholder="correo@ejemplo.com" autocomplete="off" maxlength="150">
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-whatsapp" class="block mb-1 fs-3 fw-600 pl-2">WhatsApp</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="whatsapp" class="w-p-100 h-40" id="empresa-input-whatsapp" placeholder="Número de WhatsApp" autocomplete="off" maxlength="15">
                            </div>
                        </div>
                        <div class="row-gap-0 flex flex-column">
                            <label for="empresa-input-web" class="block mb-1 fs-3 fw-600 pl-2">Sitio Web</label>
                            <div class="flex items-center gap-2">
                                <input type="text" name="web" class="w-p-100 h-40 input-mayus" id="empresa-input-web" placeholder="https://www.tuempresa.com" autocomplete="off" maxlength="255">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </form>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>
<script src="../../../public/js/ajax/pages/empresa.js"></script>
<script src="../../../public/js/components/pages/views/empresa.js"></script>