/**
 * Módulo UI Centralizado para la gestión de Teléfonos con intl-tel-input
 */
const TelefonosUI = {

    // Configuración base por defecto
    configDefault: {
        initialCountry: "mx",
        separateDialCode: true,
        preferredCountries: ["mx", "us"],
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.2/build/js/utils.js"
    },

    // Mapa de longitudes máximas permitidas (número nacional sin contar código de área)
    longitudesMaximas: {
        mx: 10, // México
        us: 10, // Estados Unidos
        ca: 10, // Canadá
        es: 9,  // España
        co: 10, // Colombia
        ar: 10, // Argentina
        pe: 9,  // Perú
        cl: 9,  // Chile
        br: 11  // Brasil
    },

    /**
     * Inicializa uno o varios selectores de teléfono
     * @param {string|jQuery} selector ID, clase o elemento jQuery
     * @returns {Array|Object|null} Instancia(s) de intlTelInput o null
     */
    init: function (selector) {
        const $elements = $(selector);
        if (!$elements.length) return null;

        if (typeof window.intlTelInput !== 'function') {
            console.error("El plugin intlTelInput no está cargado en el proyecto.");
            return null;
        }

        const instancias = [];
        const self = this;

        $elements.each((_, el) => {
            const $el = $(el);

            // Evitar doble inicialización
            if ($el.data('iti')) {
                instancias.push($el.data('iti'));
                return;
            }

            // Inicializar intlTelInput
            const iti = window.intlTelInput(el, self.configDefault);

            // Guardar la instancia en el data del elemento
            $el.data('iti', iti);

            // Bandera interna para evitar conflictos al setear valores programáticamente
            $el.data('isSettingValue', false);

            // Función para actualizar el límite dinámico según el país seleccionado
            const aplicarLimitePais = () => {
                const countryData = iti.getSelectedCountryData();
                const iso = countryData && countryData.iso2 ? countryData.iso2.toLowerCase() : 'mx';
                const maxLen = self.longitudesMaximas[iso] || 15;

                // Margen holgado en el maxlength de HTML para permitir espacios/guiones del formateador
                $el.attr('maxlength', maxLen + 5);
            };

            // Aplicar límite inicial
            aplicarLimitePais();

            // Actualizar límite si el usuario cambia de bandera
            $el.off('countrychange.itiPhone').on('countrychange.itiPhone', function () {
                aplicarLimitePais();
            });

            // Filtrar letras y validar longitud mientras el usuario escribe manualmente
            $el.off('input.itiPhone').on('input.itiPhone', function () {
                // Si estamos asignando el valor por código, ignoramos el filtro estricto temporalmente
                if ($el.data('isSettingValue')) return;

                let valorLimpio = this.value.replace(/\D/g, '');
                const countryData = iti.getSelectedCountryData();
                const iso = countryData && countryData.iso2 ? countryData.iso2.toLowerCase() : 'mx';
                const maxLen = self.longitudesMaximas[iso] || 15;

                if (valorLimpio.length > maxLen) {
                    valorLimpio = valorLimpio.substring(0, maxLen);
                    // Actualizamos el input con el corte exacto
                    this.value = valorLimpio;
                }
            });

            instancias.push(iti);
        });

        return $elements.length === 1 ? instancias[0] : instancias;
    },

    /**
     * Limpia el valor del teléfono y restablece el país por defecto
     * @param {string|jQuery} selector ID o clase del input
     */
    limpiar: function (selector) {
        const $el = $(selector);
        if (!$el.length) return;

        const iti = $el.data('iti');
        if (iti) {
            $el.val('');
            iti.setCountry(this.configDefault.initialCountry);
        } else {
            $el.val('');
        }
    },

    /**
     * Establece el valor del teléfono y actualiza la bandera automáticamente sin recortes
     * @param {string|jQuery} selector ID o clase del input
     * @param {string} valor El número (con o sin prefijo, ej. +522461112233)
     */
    setValor: function (selector, valor) {
        const $el = $(selector);
        if (!$el.length) return;

        const valorLimpio = valor ? valor.toString().trim() : '';
        const iti = $el.data('iti');

        if (iti && valorLimpio) {
            // Activamos el candado para evitar que el evento 'input' interfiera
            $el.data('isSettingValue', true);

            // Asignamos el número completo al plugin
            iti.setNumber(valorLimpio);

            // Liberamos el candado después de que el DOM procese el valor
            setTimeout(() => {
                $el.data('isSettingValue', false);
            }, 100);
        } else {
            $el.val(valorLimpio);
        }
    },

    /**
     * Obtiene el número con formato internacional (ej. +521234567890)
     * @param {string|jQuery} selector ID o clase del input
     * @returns {string}
     */
    getValor: function (selector) {
        const $el = $(selector);
        if (!$el.length) return '';

        const iti = $el.data('iti');
        return iti && iti.isValidNumber() ? iti.getNumber() : $el.val().trim();
    },

    /**
     * Valida si el número es correcto y cumple con la longitud exacta del país seleccionado
     * @param {string|jQuery} selector ID o clase del input
     * @returns {boolean}
     */
    esValido: function (selector) {
        const $el = $(selector);
        if (!$el.length) return false;

        const iti = $el.data('iti');
        return iti ? iti.isValidNumber() : false;
    }
};