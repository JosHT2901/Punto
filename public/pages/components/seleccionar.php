<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Selección dinámico";

// 2. Activamos el búfer para capturar todo el HTML
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-seleccion-dinamico">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">


        <div class="w-p-100 flex justify-center items-center py-1">
            <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1" id="span-titulo">
            </span>
        </div>
        <div class="w-p-100 px-3 my-2" id="contenedor-buscador">
            <div class="relative w-p-100 flex items-center gap-1">
                <input type="text" id="input-buscador" class="form-control w-p-100 px-3 py-2 border border-gray-200 rounded-8 bg-white" placeholder="Buscar por nombre, correo...">
                <button type="button" class="btn w-40 h-40 btn-secondary rounded-md flex justify-center items-center mx-auto" id="btn-reset-buscador-seleccionar" style="cursor: pointer;">
                        <i class="icon ph ph-x h-35 w-35 fs-6 flex justify-center items-center"></i>
                    </button>
            </div>
        </div>
        <!-- Sección de Selección y Lista -->
        <div class="flex-1 flex flex-column p-3" id="seleccion-contenedor-cuerpo">

            <!-- Opción de Seleccionar Todos -->
            <div class="w-p-100 flex gap-2 px-3 items-center">
                <div class="flex justify-center items-center w-30">
                    <input type="checkbox" id="check-item-all-seleccion" class="checkbox-round cursor-pointer">
                </div>
                <div class="flex justify-center items-center">
                    <span id="contador-span" class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1 cursor-pointer">
                        Seleccionar todos
                    </span>
                </div>
            </div>

            <!-- Contenedor donde se cargarán dinámicamente las tarjetas de usuario -->
            <div class="flex-1 p-2 custom-scroll overflow-auto" id="contenedor-tarjetas">

            </div>
        </div>

        <!-- Botones de Acción Final -->
        <div class="p-2 bg-gray-200 flex justify-end items-center mt-auto rounded-8 gap-2">
            <button type="button" class="btn btn-primary fw-600" id="btn-enviar-seleccion">Enviar</button>
        </div>
    </div>
</form>

<?php
$contenido_componente = ob_get_clean();

// Asignación segura con operador de fusión nula
$incluir_carga = $incluir_carga ?? false;

// Incluimos tu layout principal de componentes
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/components/pages/components/seleccionar.js"></script>