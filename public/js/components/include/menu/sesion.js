const UserSessionMenuComponent = {
    selectors: {
        container: '#menu-contenedor-usuario',
        btnToggle: '#menu-boton-usuario', // Botón para abrir y cerrar
        linkPerfil: '#menu-link-perfil',
        linkPreferencias: '#menu-link-preferencias',
        linkMovimientos: '#menu-link-movimientos',
        linkAyuda: '#menu-link-ayuda', // Nuevo selector de ayuda
        linkBloquear: '#menu-link-bloquear',
        btnCerrarSesion: '#menu-cerrar-sesion'
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const self = this;

        // 1. Evento único en el botón para alternar (toggle) el menú
        $(document).off('click', self.selectors.btnToggle)
            .on('click', self.selectors.btnToggle, function(e) {
                e.stopPropagation();
                console.log("Alternando menú de sesión...");
                self.toggleMenu();
            });

        // 2. Enlace a Preferencias
        $(document).off('click', self.selectors.linkPreferencias)
            .on('click', self.selectors.linkPreferencias, function(e) {
                e.preventDefault();
                window.location.href = "preferencias.php";
                self.cerrarMenu();
            });

        // 3. Enlace a Movimientos
        $(document).off('click', self.selectors.linkMovimientos)
            .on('click', self.selectors.linkMovimientos, function(e) {
                e.preventDefault();
                window.location.href = "movimientos.php";
                self.cerrarMenu();
            });

        // 4. Enlace a Perfil
        $(document).off('click', self.selectors.linkPerfil)
            .on('click', self.selectors.linkPerfil, function(e) {
                e.preventDefault();
                window.location.href = "perfil.php";
                self.cerrarMenu();
            });

        // 5. Enlace a Ayuda
        $(document).off('click', self.selectors.linkAyuda)
            .on('click', self.selectors.linkAyuda, function(e) {
                e.preventDefault();
                window.location.href = "ayuda.php";
                self.cerrarMenu();
            });

        // 6. Enlace a Bloquear
        $(document).off('click', self.selectors.linkBloquear)
            .on('click', self.selectors.linkBloquear, function(e) {
                e.preventDefault();
                // Acción para bloquear pantalla o sesión
                self.cerrarMenu();
            });

        // 7. Evento para Cerrar Sesión con MostrarPregunta y cierre de menú
        $(document).off('click', self.selectors.btnCerrarSesion)
            .on('click', self.selectors.btnCerrarSesion, async function(e) {
                e.preventDefault();
                self.cerrarMenu(); // Cierra el menú desplegable inmediatamente

                const confirma = await MostrarPregunta({
                    titulo: 'Cerrar sesión',
                    icono: 'vf-ic_fluent_key_24_filled',
                    texto: '¿Deseas cerrar sesión?',
                    confirmarText: 'Cerrar sesión',
                    colorConfirmar: 'btn-primary',
                    altura: 320
                });

                // Si el usuario confirma, ejecutamos la petición para destruir la sesión
                if (confirma) {
                    if (typeof Cerrar_Sesion === 'function') {
                        Cerrar_Sesion();
                    } else {
                        console.log("Cerrando sesión...");
                    }
                }
            });

        // 8. Cerrar automáticamente si el usuario hace clic en cualquier parte fuera del menú
        $(document).off('click.cerrarMenuFuera')
            .on('click.cerrarMenuFuera', function(e) {
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
        $(this.selectors.container).hide().slideDown(150);
    },

    cerrarMenu() {
        $(this.selectors.container).slideUp(150);
    }
};

// Inicialización de respaldo al cargar el DOM
$(document).ready(() => {
    UserSessionMenuComponent.init();
});