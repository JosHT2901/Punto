<!-- Estructura base del modal oculta por defecto -->
<div id="modal-overlay" class="flex justify-center items-center d-none" 
     style="position: fixed; inset: 0; z-index: 9999; opacity: 0; transition: opacity 0.2s ease;">
    
    <div class="modal-wrapper" style="width: 100%; max-width: 400px; margin: auto; padding: 1rem;">
        <div id="modal-content" class="modal-content bg-white rounded-sm p-px-5"
             style="max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">

            <!-- Header -->
            <div class="modal-header w-p-100 h-50 rounded-md box-sizing px-1 flex justify-center items-center">
                <div class="w-calc-100-40 h-p-100 flex justify-start items-center">
                    <div id="modal-titulo-container" class="h-35 flex justify-center items-center text-blue-03618d px-3 fs-3 bg-option rounded-2xl fw-700 d-none">
                        <span id="modal-titulo-texto" class="texto-truncado"></span>
                    </div>
                </div>

                <div class="w-40 h-p-100 flex justify-center items-center">
                    <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto" id="btn-cerrar-modal" style="cursor: pointer;">
                        <i class="icon ph ph-x h-35 w-35 fs-6 flex justify-center items-center"></i>
                    </button>
                </div>
            </div>

            <!-- Body / Contenido Dinámico -->
            <div id="modal-body-content" class="w-p-100 overflow-auto" style="flex: 1; padding: 10px;">
                <!-- Aquí se inyectará el contenido que tú quieras -->
            </div>

        </div>
    </div>
</div>