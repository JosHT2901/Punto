<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear usuario";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div action="" class="w-p-100 h-p-100 p-2 flex flex-column" id="form-gestion-usuario">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">
        
        <!-- Paso 1: Información básica -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-basico">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre (s)</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus input-100" id="crear-usuario-input-nombre" placeholder="Nombre" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-apellido-paterno" class="block mb-1 fs-3 fw-600 pl-2">Apellido paterno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_paterno" class="w-p-100 h-40 input-mayus input-100" id="crear-usuario-input-apellido-paterno" placeholder="Apellido paterno" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-apellido-materno" class="block mb-1 fs-3 fw-600 pl-2">Apellido materno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_materno" class="w-p-100 h-40 input-mayus input-100" id="crear-usuario-input-apellido-materno" placeholder="Apellido materno" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Fecha de nacimiento</label>
                        <div class="flex items-center gap-2" id="crear-usuario-contenedor-fecha-nacimiento">
                            <!-- Aquí se inyecta la fecha dinámicamente -->
                        </div>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="2" id="crear-usuario-informacion-basica-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 2: Identificación -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-identidad">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Identificación</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-curp" class="block mb-1 fs-3 fw-600 pl-2">C.U.R.P.</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="curp" class="w-p-100 h-40 input-mayus" id="crear-usuario-input-curp" placeholder="Ingresa el C.U.R.P." autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 fs-3" id="crear-usuario-span-curp"></span>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-rfc" class="block mb-1 fs-3 fw-600 pl-2">R.F.C.</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="rfc" class="w-p-100 h-40 input-mayus" id="crear-usuario-input-rfc" placeholder="Ingresa el R.F.C." autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-usuario-span-rfc"></span>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="1">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="3" id="crear-usuario-identidad-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 3: Contacto -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-contacto">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Contacto</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-telefono" class="block mb-1 fs-3 fw-600 pl-2">Teléfono</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="telefono" class="w-p-100 h-40 input-mayus" id="crear-usuario-input-telefono" placeholder="Ingresa un teléfono" autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-usuario-span-telefono"></span>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-correo" class="block mb-1 fs-3 fw-600 pl-2">Correo</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="correo" class="w-p-100 h-40 input-mayus input-100" id="crear-usuario-input-correo" placeholder="Ingresa un correo electrónico" autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-usuario-span-correo"></span>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="2">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="crear-usuario-contacto-boton-siguiente" data-target-step="4">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 4: Cuenta -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-usuario">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Cuenta</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-usuario" class="block mb-1 fs-3 fw-600 pl-2">Usuario</label>
                        <div class="flex items-center gap-2">
                            <span class="fw-600 pl-1">@</span>
                            <input type="text" name="usuario" class="w-p-100 h-40 input-mayus input-50" id="crear-usuario-input-usuario" placeholder="Ingresa un nombre de usuario" autocomplete="off">
                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="crear-usuario-boton-generar-usuario" title="Generar usuario">
                                <i class="ph ph-magic-wand fs-6"></i>
                            </a>
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="crear-usuario-span-usuario"></span>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="3">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="5" id="crear-usuario-usuario-boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 5: Contraseña -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-password">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Contraseña</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-password" class="block mb-1 fs-3 fw-600 pl-2">Ingresa la contraseña</label>
                        <div class="flex items-center gap-2">
                            <input type="password" name="password" class="w-p-100 h-40" id="crear-usuario-input-password" placeholder="Ingresa tu contraseña" autocomplete="off">
                        </div>
                    </div>
                    <div id="reglas-container" class="py-2 bg-option rounded-8"></div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-usuario-input-confirm-password" class="block mb-1 fs-3 fw-600 pl-2">Confirma la contraseña</label>
                        <div class="flex items-center gap-2">
                            <input type="password" name="confirmar_password" class="w-p-100 h-40" id="crear-usuario-input-confirm-password" placeholder="Ingresa tu contraseña" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                            <input type="checkbox" class="checkbox-round" id="crear-usuario-input-check-password">
                            <span class="fs-3">Mostrar contraseñas</span>
                        </label>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="4">Anterior</button>
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" id="crear-usuario-password-boton-siguiente" data-target-step="6">Siguiente</button>
                </div>
            </div>
        </div>

        <!-- Paso 6: PIN -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-usuario-pin">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>PIN</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle d-none">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Ingresa el pin</label>
                        <div class="flex items-center gap-2 p-4 box-sizing">
                            <div id="contenedor-pin" class="flex col-gap-2"></div>
                        </div>
                    </div>
                    <div id="reglas-container-pin" class="py-2 bg-option rounded-8"></div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Confirma el pin</label>
                        <div class="flex items-center gap-2 p-4 box-sizing">
                            <div id="contenedor-pin-confirmacion" class="flex col-gap-2"></div>
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                            <input type="checkbox" class="checkbox-round" id="crear-usuario-input-check-pin">
                            <span class="fs-3">Mostrar pin</span>
                        </label>
                    </div>
                </div>
                <div class="flex justify-between">
                    <button type="button" class="btn btn-ghost js-wizard-prev fw-600" data-target-step="5">Anterior</button>
                    <button type="button" class="btn btn-primary fw-600 js-wizard-next" id="crear-usuario-pin-boton-siguiente">Guardar usuario</button>
                </div>
            </div>
        </div>

    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/crear.usuario.js" defer></script>
<script src="../../../public/js/components/pages/components/crear.usuario.js" defer></script>