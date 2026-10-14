<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear cliente";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<form action="" class="w-p-100 h-p-100 py-2 flex flex-column">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">
        <div class="w-p-100 my-2 rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Estado</label>
                        <div class="flex items-center gap-2 h-35" id="buscador-codigo-postal-contenedor-select-estado">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Municipio</label>
                        <div class="flex items-center gap-2 h-35" id="buscador-codigo-postal-contenedor-select-municipio">
                        </div>
                    </div>
                    <div class="row-gap-0 flex flex-column">
                        <label class="block mb-1 fs-3 fw-600 pl-2">Localidad</label>
                        <div class="flex items-center gap-2 h-35" id="buscador-codigo-postal-contenedor-select-localidad">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="w-p-100 my-2 rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
                <span>Código postal identificado</span>
            </div>
            <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
                <div class="my-3 flex gap-4" id="buscador-codigo-postal-encontrado">
                    <div class="flex justify-start items-center fw-700 fs-8 flex-1 px-3">
                        <span id="buscador-codigo-postal-span-codigo"></span>
                    </div>
                    <div class="flex">
                        <button type="button" class="btn btn-primary js-wizard-next fw-600" data-target-step="3" id="crear-cliente-identidad-boton-siguiente">Copiar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../js/ajax/components/buscador.codigo.postal.js" defer></script>