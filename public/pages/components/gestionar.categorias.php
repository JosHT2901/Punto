<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Crear Categoría";

// 2. Activamos el búfer para capturar todo el HTML
ob_start();
?>
<form class="w-p-100 h-p-100 py-2 flex flex-column" id="form-gestion-categoria">
    <div class="w-p-100 flex flex-column js-wizard-container flex-1 min-w-0 ocultar-scroll">
        
        <!-- Sección 1: Información básica de la Categoría -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container" id="form-crear-categoria-informacion-basica">
            <div class="w-p-100 text-blue-03618d fw-600 h-40 p-2 box-sizing bg-blue-03618d card-header js-header-toggle cursor-pointer flex items-center">
                <span>Información básica</span>
            </div>
            <div class="flex-1 min-h-0 my-3 flex flex-column row-gap-1 card-body js-panel-toggle">
                <div class="my-3 flex flex-column gap-4">
                    <div class="row-gap-0 flex flex-column">
                        <label for="crear-categoria-input-nombre" class="block mb-1 fs-3 fw-600 pl-2">Nombre de la categoría</label>
                        <div class="flex items-center gap-2">
                            <input type="text" name="nombre_categoria" class="w-p-100 h-40 input-mayus px-3 border-light rounded-sm input-mayus" id="crear-categoria-input-nombre" placeholder="Ej: Zapatos, Desechables, Alimento" autocomplete="off">
                        </div>
                        <span class="my-1 fw-600 text-danger fs-3" id="categoria-span-nombre"></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sección 2: Atributos Dinámicos de la Categoría -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 flex-1 min-h-0 flex flex-column" id="form-crear-categoria-atributos">
            
            <!-- Cabecera de la sección de Atributos -->
            <div class="w-p-100 text-blue-03618d fw-600 p-2 box-sizing bg-blue-03618d flex cursor-pointer items-center">
                <div class="flex-1 flex justify-start items-center">
                    <span>Atributos Personalizados</span>
                </div>
                <div class="flex">
                    <button type="button" class="btn btn-primary fw-600" id="btn-agregar-atributo">Agregar</button>
                </div>
            </div>

            <!-- Barra de Selección Masiva y Contadores -->
            <div class="w-p-100 flex h-35 gap-2 my-2 align-items-center">
                <div class="flex-1 flex position-relative align-items-center">
                    <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600" id="contador-atributos">0 atributos</span>
                    
                    <!-- Panel flotante de acciones masivas -->
                    <div class="position-absolute row-gap-2 top-0 left-0 w-p-100 h-p-100 flex d-none bg-gray-100 px-2 rounded-8 align-items-center z-index-10" id="contenedor-atributos-acciones">
                        <div class="flex justify-start items-center fw-600 flex-1">
                            <span class="rounded-8 bg-brand-soft p-2 text-brand-blue" id="contador-atributos-acciones-texto">0 atributos</span>
                        </div>
                        <div class="flex justify-center items-center">
                            <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30" id="btn-eliminar-atributos-seleccionados" title="Eliminar seleccionados">
                                <i class="icon vf-ic_fluent_delete_24_filled fs-6"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cabeceras de columnas -->
            <div class="flex-1 min-h-0 flex flex-column" id="categorias-contenedor-tabla">
                <div class="flex h-40 gap-2 align-items-center">
                    <div class="w-30"></div> <!-- Espacio para alinear con el checkbox -->
                    <div class="flex-1 flex justify-start items-center px-2">
                        <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Nombre del atributo</span>
                    </div>
                    <div class="w-250 flex justify-center items-center">
                        <span class="bg-brand-soft fw-600 p-1 rounded-8 text-brand">Tipo del atributo</span>
                    </div>
                </div>

                <!-- Contenedor dinámico donde se inyectarán las tarjetas de atributos -->
                <div class="flex-1 min-h-100 overflow-auto custom-scroll" id="contenedor-lista-atributos">
                    <!-- Las tarjetas se generan dinámicamente con JS -->
                </div>
            </div>
        </div>

        <!-- Botón de Guardar Final -->
        <div class="p-2 bg-gray-200 flex justify-end items-center mt-auto rounded-8">
            <button  class="btn btn-primary fw-600" id="btn-guardar-categoria">Guardar Categoría</button>
        </div>
    </div>
</form>

<?php
$contenido_componente = ob_get_clean();

// Incluimos tu layout principal de componentes
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/gestionar.categorias.js" defer></script>
<!-- Script JS específico para gestionar categorías y atributos -->
<script src="../../../public/js/components/pages/components/gestionar.categorias.js" defer></script>