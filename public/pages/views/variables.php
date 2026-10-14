<?php
$tituloPage = "Variables de entorno";
$idBotonAtras = "variables-boton-atras";
$idBotonGuardar = "variables-boton-guardar"; 

ob_start();
?>

<div class="w-p-100 overflow-auto flex-column h-p-100 p-3 custom-scroll">
    
    <!-- Acordeón 1: Moneda -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
        <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
            <span>Moneda</span>
        </div>
        <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
            <div class="my-3 flex flex-column gap-4">
                <div class="row-gap-0 flex flex-column">
                    <label for="select-moneda" class="block mb-1 fs-3 fw-600 pl-2">Símbolo de moneda</label>
                    <div class="flex items-center gap-2 h-40" id="contenedor-select-moneda">
                    </div>
                </div>
                <div class="row-gap-0 flex flex-column">
                    <label for="select-codigo-iso" class="block mb-1 fs-3 fw-600 pl-2">Código I.S.O.</label>
                    <div class="flex items-center gap-2 h-40" id="contenedor-select-codigo-iso">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Acordeón 2: Precios -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
        <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
            <span>Precios</span>
        </div>
        <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
            <div class="my-3 flex flex-column gap-4">
                <div class="row-gap-0 flex items-center bg-gray-200 p-2 rounded-md">
                    <div class="flex-1 flex justify-start items-center">
                        <label for="variables-check-round" class="block mb-0 fs-3 fw-600 pl-2 pointer">Redondear precios</label>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="toggle-switch pointer mx-2">
                            <input type="checkbox" id="variables-check-round">
                            <div class="toggle-switch-background">
                                <div class="toggle-switch-handle"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Acordeón 3: Límites operativos -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container">
        <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer">
            <span>Límites operativos</span>
        </div>
        <div class="flex-1 min-h-0 my-3 card-body js-panel-toggle">
            <div class="my-3 flex flex-column gap-4">
                <div class="row-gap-0 flex items-center bg-gray-200 p-2 rounded-md">
                    <div class="flex-1 flex justify-start items-center">
                        <label for="variables-check-limit" class="block mb-0 fs-3 fw-600 pl-2 pointer">Bloquear venta si el stock es cero</label>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="toggle-switch pointer mx-2">
                            <input type="checkbox" id="variables-check-limit">
                            <div class="toggle-switch-background">
                                <div class="toggle-switch-handle"></div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

<?php
// Guardamos todo el contenido en la variable del layout
$contenido_componente = ob_get_clean();

// Llamamos al layout especializado
include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>

<!-- Scripts específicos del módulo -->
<script src="../../../public/js/ajax/pages/variables.js" defer></script>
<script src="../../../public/js/components/pages/views/variables.js" defer></script>