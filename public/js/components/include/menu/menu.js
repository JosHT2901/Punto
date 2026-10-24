const UserMenuComponent = {
    selectors: {
        container: '#menu-contenedor-lateral',
        btnAbrir: '#menu-boton-abrir',
        btnCerrar: '#menu-boton-cerrar'
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const self = this;

        // 1. Botón para abrir o alternar el menú (con delegación de eventos)
        $(document).on('click', self.selectors.btnAbrir, function(e) {
            e.stopPropagation();
            console.log("Abriendo/Alternando menú...");
            self.toggleMenu();
        });

        // 2. Botón específico para cerrar el menú
        $(document).on('click', self.selectors.btnCerrar, function(e) {
            e.stopPropagation();
            console.log("Cerrando menú...");
            self.cerrarMenu();
        });

        // 3. Opcional: Cerrar si hacen clic fuera del menú
        $(document).on('click', function(e) {
            const $container = $(self.selectors.container);
            const $btnAbrir = $(self.selectors.btnAbrir);

            if ($container.is(':visible') && 
                !$container.is(e.target) && $container.has(e.target).length === 0 &&
                !$btnAbrir.is(e.target) && $btnAbrir.has(e.target).length === 0) {
                self.cerrarMenu();
            }
        });
    },

    // --- FUNCIONES REUTILIZABLES CORREGIDAS ---
    toggleMenu() {
        const $container = $(this.selectors.container);
        if ($container.is(':visible')) {
            this.cerrarMenu();
        } else {
            this.abrirMenu();
        }
    },

    abrirMenu() {
        // Aseguramos que se muestre usando flex en lugar de block
        $(this.selectors.container).css('display', 'flex').hide().fadeIn(150);
    },

    cerrarMenu() {
        $(this.selectors.container).fadeOut(150);
    }
};

// Inicializar al cargar el documento
$(document).ready(() => {
    console.log("##")
    UserMenuComponent.init();
});