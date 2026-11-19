<?php
ob_start();
?>

<div class="w-p-100 overflow-auto flex-column h-p-100 flex">
    <div class="w-p-100 h-70 overflow-auto my-px-10">
        <div class="w-p-100 flex justify-center items-center gap-3 bg-option rounded-8 p-2 box-sizing shadow-2xs border border-slate-200/60">

            <!-- Procesadas / Éxito -->
            <div class="w-p-33 h-p-100 flex flex-column justify-center items-center">
                <div class="h-25 flex justify-center items-center">
                    <div class="h-22 flex justify-center items-center text-emerald-700 bg-emerald-50 px-3 fs-2 rounded-full fw-600 border border-emerald-200/50">
                        <span class="texto-truncado">Procesadas</span>
                    </div>
                </div>
                <div class="w-p-100 h-25 flex justify-center items-center text-emerald-600">
                    <span class="fw-700 fs-4" id="span-procesadas">0</span>
                </div>
            </div>

            <!-- Error / Fallidos -->
            <div class="w-p-33 h-p-100 flex flex-column justify-center items-center border-x border-slate-200/60">
                <div class="h-25 flex justify-center items-center">
                    <div class="h-22 flex justify-center items-center text-red-700 bg-red-50 px-3 fs-2 rounded-full fw-600 border border-red-200/50">
                        <span class="texto-truncado">Error</span>
                    </div>
                </div>
                <div class="w-p-100 h-25 flex justify-center items-center text-red-600">
                    <span class="fw-700 fs-4" id="span-no-procesadas">0</span>
                </div>
            </div>

            <!-- Total -->
            <div class="w-p-33 h-p-100 flex flex-column justify-center items-center">
                <div class="h-25 flex justify-center items-center">
                    <div class="h-22 flex justify-center items-center text-blue-03618d bg-blue-50 px-3 fs-2 rounded-full fw-600 border border-blue-200/50">
                        <span class="texto-truncado">Total</span>
                    </div>
                </div>
                <div class="w-p-100 h-25 flex justify-center items-center text-blue-03618d">
                    <span class="fw-700 fs-4" id="span-total">0</span>
                </div>
            </div>

        </div>
    </div>

    <!-- Contenedor dinámico de la lista de detalles -->
    <div class="flex-1 box-sizing p-1 contenedor flex flex-column" id="contenedor-lista">
        
        <!-- Sección 1: Procesados -->
        <div class="flex-1 flex flex-column">
            <div class="h-40 flex rounded-md bg-success-soft justify-center items-center fw-600 text-success shrink-0 mb-1">
                <span>Procesados</span>
            </div>
            <div class="flex-1 overflow-auto custom-scroll" id="procesados-lista" style="max-height:200px">
            
            </div>
        </div>

        <!-- Sección 2: Errores -->
        <div class="flex-1 flex flex-column mt-2">
            <div class="h-40 flex rounded-md bg-warning-soft justify-center items-center fw-600 text-warning shrink-0 mb-1">
                <span>Errores</span>
            </div>
            <div class="flex-1 overflow-auto custom-scroll" id="errores-lista" style="max-height:200px">
               
            </div>
        </div>

    </div>
</div>
<?php
// 3. Guardamos todo el bloque anterior en la variable del layout
$contenido_componente = ob_get_clean();

// 4. Llamamos a nuestro layout especializado para componentes
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/components/pages/components/informacion.js"></script>