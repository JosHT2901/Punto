<!-- Plantilla estática para el modal de preguntas/confirmaciones -->
<div id="plantilla-pregunta-html" class="d-none">
    <div class="w-p-100 h-p-100 flex flex-column justify-between p-3 box-sizing">
        
        <!-- Icono superior -->
        <div class="w-p-100 flex justify-center items-center py-2">
            <div class="flex justify-center items-center rounded-full bg-brand-soft p-3">
                <i class=" js-pregunta-icono fs-12 text-brand flex justify-center items-center"></i>  
            </div>
        </div>

        <!-- Texto de la pregunta -->
        <div class="w-p-100 my-2 px-3 flex justify-center items-center text-center">
            <span class="fs-4 fw-600 text-gray-700 line-height-normal js-pregunta-texto">¿Estás seguro?</span>
        </div>

        <!-- Contenedor de Botones (Acciones) -->
        <div class="w-p-100 h-45 flex gap-2 justify-center items-center mt-3">
            <div class="w-p-50 h-p-100 flex justify-stretch items-center js-contenedor-btn-izquierdo"></div>
            <div class="w-p-50 h-p-100 flex justify-stretch items-center js-contenedor-btn-derecho"></div>
        </div>

    </div>
</div>