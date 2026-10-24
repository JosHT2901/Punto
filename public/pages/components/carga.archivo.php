<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Cargar archivos";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100 h-p-100 p-2 flex flex-column">
    <div class="w-p-100 p-2 bg-white rounded-md my-3 flex d-none" id="contenedor-plantilla">
        <div class="flex-1 flex justify-start items-center fw-600">
            <span>Plantilla</span>
        </div>
        <div class="">
            <a type="button" id="btn-descargar-plantilla" class="btn btn-secondary fw-600 flex shrink-0" style="flex-shrink: 0; white-space: nowrap;">
                <i class="vf-ic_fluent_arrow_download_24_filled"></i>
                <span>Descargar</span>
            </a>
        </div>
    </div>
    <div class="flex-1 position-relative overflow-auto custom-scroll" id="mi-contenedor"></div>
    <div class="w-p-100 flex justify-end items-center my-2 p-2 d-none" id="contenedor-boton-enviar">
        <a type="button" class="btn btn-secondary fw-600 flex shrink-0" style="flex-shrink: 0; white-space: nowrap;" id="boton-enviar-archivo">
            <i class="vf-ic_fluent_send_24_filled"></i>
            <span>Enviar</span>
        </a>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/components/pages/components/cargar.archivo.js" defer></script>