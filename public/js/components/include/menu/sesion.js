const UserSessionMenuComponent = {
    selectors: {
        container: '#menu-contenedor-usuario',
        btnToggle: '#menu-boton-usuario' // Un solo botón para abrir y cerrar
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const self = this;

        // 1. Evento único en el botón para alternar (toggle) el menú
        $(document).on('click', self.selectors.btnToggle, function(e) {
            e.stopPropagation();
            console.log("Alternando menú de sesión...");
            self.toggleMenu();
        });

        // 2. Cerrar automáticamente si el usuario hace clic en cualquier parte fuera del menú
        $(document).on('click', function(e) {
            const $container = $(self.selectors.container);
            const $btnToggle = $(self.selectors.btnToggle);

            // Si está abierto y el clic no fue dentro del contenedor ni en el botón
            if ($container.is(':visible') && 
                !$container.is(e.target) && $container.has(e.target).length === 0 &&
                !$btnToggle.is(e.target) && $btnToggle.has(e.target).length === 0) {
                self.cerrarMenu();
            }
        });
    },

    // --- FUNCIONES REUTILIZABLES ---
    toggleMenu() {
        const $container = $(this.selectors.container);
        if ($container.is(':visible')) {
            this.cerrarMenu();
        } else {
            this.abrirMenu();
        }
    },

    abrirMenu() {
        // Despliega hacia abajo manteniendo el display flex
        $(this.selectors.container).hide().slideDown(150);
    },

    cerrarMenu() {
        // Desliza hacia arriba para ocultarlo
        $(this.selectors.container).slideUp(150);
    }
};

// Inicializar al cargar el documento
$(document).ready(() => {
    UserSessionMenuComponent.init();
});