<?php
$tituloPage = 'Logotipo de la empresa';
ob_start();
?>
<div class=" flex flex-column position-relative overflow-auto custom-scroll p-3 h-p-100">
    <div class="w-p-100 mb-2 h-40 flex justify-end items-center d-none" id="contenedor-boton-eliminar">
        <button type="button" class="btn btn-secondary fw-600" id="btn-eliminar-imagen">
            <span>Eliminar imagen</span>
        </button>
    </div>
    <div class="flex-1 min-h-0" id="contenedor-croppie">

    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>
<script src="../../../public/js/ajax/pages/logo.empresa.js" defer></script>
<script src="../../../public/js/components/pages/views/logo.empresa.js" defer></script>