<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Gestión de sucursales";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">

        <!-- Paso 1: Información básica -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="input-nombre" class="block mb-1 fs-3 fw-600 pl-2" id="label-input-nombre"></label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre" class="w-p-100 h-40 input-mayus input-100" id="input-nombre"
                            autocomplete="off">
                        </div>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button type="button" class="btn btn-primary js-wizard-next fw-600" 
                    id="boton-siguiente">Siguiente</button>
                </div>
            </div>
        </div>
    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/components/pages/components/input.js" defer></script>