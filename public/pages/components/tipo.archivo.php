<?php
ob_start();
?>

<div class="w-p-100 overflow-auto flex-column h-p-100 flex p-2">
    <div class="flex justify-center items-center">
        <span class="rounded-8 bg-brand-soft p-1 px-2 h-30 justify-center items-center text-brand-blue fw-600">
           Selecciona un tipo de archivo
        </span>
    </div>
    <div class="flex-1 overflow-auto custom-scroll flex flex-wrap gap-3 py-3" id="contenedor-tarjetas">

    </div>
    <div class="w-p-100 p-2 flex justify-end items-center">
        <a type="button" class="btn btn-primary fw-600 flex shrink-0" style="flex-shrink: 0; white-space: nowrap;" id="boton-seguir">
            <i class="vf-ic_fluent_send_24_filled"></i>
            <span>Seguir</span>
        </a>
    </div>
</div>
<?php
// 3. Guardamos todo el bloque anterior en la variable del layout
$contenido_componente = ob_get_clean();

// 4. Llamamos a nuestro layout especializado para componentes
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/components/pages/components/tipo.archivo.js"></script>