<?php
$tituloPage = 'Imagen de perfil';
ob_start();
?>
<div class=" flex flex-column position-relative overflow-auto custom-scroll p-3 h-p-100">
    <div class="w-p-100 mb-2 h-40 flex justify-between items-center col-gap-1">
        <button type="button" class="btn btn-secondary fw-600 d-none" id="btn-eliminar-imagen">
            <span>Eliminar imagen</span>
        </button>
        <button type="button" class="btn btn-primary fw-600" id="btn-guardar-imagen" >
            <span>Guardar</span>
        </button>
    </div>
    <div class="flex-1 min-h-0" id="contenedor-croppie">

    </div>
</div>
<?php
$contenido_componente = ob_get_clean();
$incluir_carga = false;
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/imagen.usuario.js" defer></script>
<script src="../../../public/js/components/pages/components/imagen.usuario.js" defer></script>