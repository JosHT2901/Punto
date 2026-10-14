<!-- Plantilla estática para mensajes con botón de acción -->
<div id="plantilla-mensaje-accion-html" class="d-none">
    <div class="w-p-100 h-p-100 row-gap-2 flex flex-column justify-between p-3">
        <div class="w-p-100 h-80 flex justify-center items-center">
            <div class="flex justify-center items-center">
                <!-- Icono dinámico -->
                <i class="icon js-mensaje-icono h-p-100 fs-17 flex justify-center items-center"></i>  
            </div>
        </div>
        <div class="fs-3 fw-600 text-gray-600 w-p-100 my-px-10 flex justify-center items-center text-center">
            <!-- Texto dinámico -->
            <span class="js-mensaje-texto text-center"></span>
        </div>
        <div class="w-p-100 flex justify-center items-center pb-2">
            <!-- Botón de acción interactivo -->
            <button type="button" class="btn btn-primary fw-600 js-mensaje-btn-accion d-none w-p-80 h-40 rounded-8"></button>
        </div>
    </div>
</div>