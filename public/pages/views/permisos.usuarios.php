<?php
$tituloPage = 'Permisos';
ob_start();
?>
<div class="w-p-100 p-3 flex flex-column h-p-100 gap-3 bg-light">
    <div class="w-p-100 bg-brand-soft p-3 rounded-12 flex flex-column gap-3 border shadow-sm" style="background-color: #f0f4f8;">
        <!-- Fila superior: Avatar e Información del Usuario -->
        <div class="w-p-100 flex items-center gap-3">
            <!-- Avatar con iniciales -->
            <div class="flex-center bg-brand text-white fw-700 fs-5 rounded-circle shadow-sm flex-shrink-0" style="width: 56px; height: 56px; background-color: #03618d;">
                JH
            </div>
            <!-- Datos de identidad -->
            <div class="flex flex-column justify-center flex-1 overflow-hidden px-2">
                <span class="fw-700 fs-4 text-dark text-left w-p-100 text-truncate" id="label-nombre-usuario"></span>
                <span class="text-left fs-2 text-gray-700 fw-600 word-break-all block" id="label-name-usuario"></span>
            </div>
        </div>

        <!-- Fila inferior: Estadísticas de permisos -->
        <div class="w-p-100 flex justify-between items-center px-2 py-2 border-top" style="border-color: rgba(3, 97, 141, 0.15) !important;">
            <span class="fs-2 text-uppercase fw-600 text-gray-600">Permisos asignados</span>
            <span class="fw-700 fs-4 text-brand" style="color: #03618d;" id="contador-global-permisos">12 / 24</span>
        </div>
    </div>
    <div class="flex-1 flex flex-column overflow-auto" id="contenedor-global">
        <div class="">
            <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                <input type="checkbox" class="checkbox-round" id="input-check-password">
                <span class="fs-3">Seleccionar todos</span>
            </label>
        </div>
        <div class="flex-1 overflow-auto flex gap-3 flex-wrap p-2 custom-scroll" id="contenedor-modulos-permisos">
            <div class="bg-white border rounded-12 p-3 shadow-sm flex flex-column gap-3 modulo-card" style="flex: 1 1 340px; min-width: 280px;" data-modulo="finanzas">
                <div class="flex items-center justify-between px-2 border-bottom">
                    <div>
                        <input type="checkbox" class="checkbox-round modulo-toggle-master" data-target="finanzas" title="Marcar todo el módulo">
                    </div>
                    <div class="flex-1 px-3 gap-3">
                        <div class="flex justify-start items-center flex-column gap-1">
                            <span class="w-p-100 text-left fw-600">Finanzas</span>
                            <span class="w-p-100 text-left fw-600 fs-2 text-brand">0 de 6 asignados</span>
                        </div>
                    </div>

                </div>

                <div class="flex flex-column gap-2 max-h-300 overflow-y-auto pr-1">
                    <label class="flex items-center  justify-start btn-secondary p-2 rounded-8 border btn cursor-pointer permiso-row gap-2">
                        <input type="checkbox" class="checkbox-round permiso-item flex-shrink-0" name="permisos[]" value="fin_reporte_ganancia" data-modulo="finanzas">
                        <div class="flex flex-column px-3 gap-3">
                            <span class="block fw-600 fs-3 text-gray-800">Ver Reporte de Ganancias</span>
                            <span class="block fs-1 text-gray-500 fw-600">Métricas de utilidad bruta y neta</span>
                        </div>

                    </label>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="w-p-100 position-absolute bg-white left-0 flex flex-column top-0 h-p-100 overflow-auto" id="contenedor-skeleton-carga-permisos">

    <!-- Barra Superior de 56px (Skeleton del Menú) -->
    <div class="w-p-100 shadow-bottom" style="height: 56px;">
        <div class="w-p-100 h-p-100 box-sizing p-2 flex items-center justify-between gap-4 bg-white">

            <!-- 1. Skeleton Botón Menú -->
            <div class="flex-center">
                <div class="w-40 h-40 bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            <!-- 2. Skeleton Información de Sucursal -->
            <div class="flex-1 min-w-0">
                <div class="w-p-100 flex items-center justify-between bg-gray-200 rounded-md px-3 py-2 animate-pulse" style="height: 36px;">
                    <div class="bg-gray-300 rounded-4 w-p-40 h-15"></div>
                    <div class="bg-gray-300 rounded-4 w-15 h-15"></div>
                </div>
            </div>

            <!-- 3. Skeleton Acciones y Notificaciones -->
            <div class="flex items-center gap-1 shrink-0">
                <div class="w-40 h-40 bg-gray-200 rounded-md animate-pulse"></div>
                <div class="w-40 h-40 bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            <!-- 4. Skeleton Avatar Usuario -->
            <div class="flex-center shrink-0 px-2">
                <div class="w-40 h-40 bg-gray-200 rounded-circle animate-pulse"></div>
            </div>

        </div>
    </div>

    <!-- Contenido Principal (Skeleton) -->
    <div class="flex flex-column p-3 gap-3 flex-1 overflow-auto">

        <!-- Skeleton Tarjeta de Usuario -->
        <div class="w-p-100 bg-brand-soft p-3 rounded-12 flex flex-column gap-3 border shadow-sm" style="background-color: #f0f4f8;">
            <div class="w-p-100 flex items-center gap-3">
                <div class="bg-gray-300 rounded-circle flex-shrink-0 animate-pulse" style="width: 56px; height: 56px;"></div>
                <div class="flex flex-column justify-center flex-1 gap-2">
                    <div class="bg-gray-300 rounded-4 w-p-60 h-20 animate-pulse"></div>
                    <div class="bg-gray-300 rounded-4 w-p-80 h-15 animate-pulse"></div>
                </div>
            </div>
            <div class="w-p-100 flex justify-between items-center px-2 py-2 border-top" style="border-color: rgba(3, 97, 141, 0.15) !important;">
                <div class="bg-gray-300 rounded-4 w-100 h-15 animate-pulse"></div>
                <div class="bg-gray-300 rounded-4 w-50 h-15 animate-pulse"></div>
            </div>
        </div>

        <!-- Skeleton Botón Seleccionar Todos -->
        <div>
            <div class="h-40 w-p-100 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        <!-- Contenedor con 2 Tarjetas de Módulos Más Largas -->
        <div class="flex-1 overflow-hidden flex gap-3 flex-wrap p-2">

            <!-- Tarjeta Módulo 1 (Más larga) -->
            <div class="bg-white border rounded-12 p-3 shadow-sm flex flex-column gap-3" style="flex: 1 1 340px; min-width: 280px;">
                <div class="flex items-center justify-between px-2 pb-2 border-bottom">
                    <div class="bg-gray-300 rounded-4 w-20 h-20 animate-pulse"></div>
                    <div class="flex-1 px-3 flex flex-column gap-1">
                        <div class="bg-gray-300 rounded-4 w-100 h-15 animate-pulse"></div>
                        <div class="bg-gray-300 rounded-4 w-70 h-10 animate-pulse"></div>
                    </div>
                </div>
                <div class="flex flex-column gap-2">
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-70 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-40 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-85 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-50 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-60 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-30 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-75 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-45 h-8"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tarjeta Módulo 2 (Más larga) -->
            <div class="bg-white border rounded-12 p-3 shadow-sm flex flex-column gap-3" style="flex: 1 1 340px; min-width: 280px;">
                <div class="flex items-center justify-between px-2 pb-2 border-bottom">
                    <div class="bg-gray-300 rounded-4 w-20 h-20 animate-pulse"></div>
                    <div class="flex-1 px-3 flex flex-column gap-1">
                        <div class="bg-gray-300 rounded-4 w-90 h-15 animate-pulse"></div>
                        <div class="bg-gray-300 rounded-4 w-60 h-10 animate-pulse"></div>
                    </div>
                </div>
                <div class="flex flex-column gap-2">
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-75 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-45 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-80 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-35 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-65 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-50 h-8"></div>
                        </div>
                    </div>
                    <div class="p-2 rounded-8 border bg-gray-100 flex items-center gap-2 animate-pulse" style="height: 48px;">
                        <div class="bg-gray-300 rounded-4 w-20 h-20"></div>
                        <div class="flex flex-column gap-1 flex-1">
                            <div class="bg-gray-300 rounded-4 w-p-85 h-12"></div>
                            <div class="bg-gray-300 rounded-4 w-p-40 h-8"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </div>
</div>
<?php
$contenido_componente = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>

<script src="../../../public/js/ajax/pages/permisos.js"></script>
<script src="../../../public/js/components/pages/views/permisos.js"></script>