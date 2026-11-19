<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear usuario";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div action="" class="w-p-100 h-p-100 flex flex-column bg-white" id="form-gestion-usuario">
    <div class="w-p-100 flex flex-column flex-1 min-w-0 ocultar-scroll">

        <!-- Paso 1: Información básica -->
        <div class="w-p-100 my-2 row-gap-1 card d-none" id="form-informacion-basica">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header cursor-pointer">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre (s)</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus input-100" id="input-nombre" placeholder="Nombre" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-apellido-paterno" class="block mb-1 fs-3 fw-600 pl-2">Apellido paterno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_paterno" class="w-p-100 h-40 input-mayus input-100" id="input-apellido-paterno" placeholder="Apellido paterno" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-apellido-materno" class="block mb-1 fs-3 fw-600 pl-2">Apellido materno</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="apellido_materno" class="w-p-100 h-40 input-mayus input-100" id="input-apellido-materno" placeholder="Apellido materno" autocomplete="off">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Fecha de nacimiento</label>
                        <div class="flex items-center gap-2" id="contenedor-fecha-nacimiento">
                            <!-- Aquí se inyecta la fecha dinámicamente -->
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-curp" class="block mb-1 fs-3 fw-600 pl-2">C.U.R.P.</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="curp" class="w-p-100 h-40 input-mayus" id="input-curp" placeholder="Ingresa el C.U.R.P." autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 fs-3" id="span-curp"></span>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-rfc" class="block mb-1 fs-3 fw-600 pl-2">R.F.C.</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="rfc" class="w-p-100 h-40 input-mayus" id="input-rfc" placeholder="Ingresa el R.F.C." autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="span-rfc"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Paso 3: Contacto -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card d-none" id="form-contacto">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header cursor-pointer">
                <span>Contacto</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-telefono" class="block mb-1 fs-3 fw-600 pl-2">Teléfono</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="telefono" class="w-p-100 h-40 input-mayus" id="input-telefono" placeholder="Ingresa un teléfono" autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="span-telefono"></span>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-correo" class="block mb-1 fs-3 fw-600 pl-2">Correo</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="correo" class="w-p-100 h-40 input-mayus input-100" id="input-correo" placeholder="Ingresa un correo electrónico" autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="span-correo"></span>
                    </div>
                </div>

            </div>
        </div>
    </div>
    <div class="flex justify-end py-2">
        <button type="button" class="btn btn-primary fw-600" id="boton-siguiente">Siguiente</button>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();
$incluir_carga = false;
include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/ajax/components/editar.usuario.actual.js"></script>
<script src="../../../public/js/components/pages/components/editar.usuario.actual.js" defer></script>