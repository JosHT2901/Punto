$(document).ready(async function () {
   // Esperamos a que los datos iniciales (permisos y preferencias) terminen de cargarse
   await Obtener_Datos_Iniciales();
   Iniciar_Reloj()
   // Una vez listos, disparamos el evento de inicialización de la app
   $(document).trigger('app:inicializada');
});


function Iniciar_Reloj() {
   console.log("Preferencias de usuario actuales:", window.PreferenciasUsuario);

   // Obtener los formatos configurados en las preferencias del usuario (con valores por defecto seguros)
   const formatoHora = window.PreferenciasUsuario?.reloj_formato || 'g:i a';
   const formatoFecha = window.PreferenciasUsuario?.formato_fecha || 'd/m/Y';

   const actualizarRelojYFecha = () => {
       const ahora = new Date();
       let horas = ahora.getHours();
       const minutos = ahora.getMinutes();
       const segundos = ahora.getSeconds();
       const dia = ahora.getDate();
       const mes = ahora.getMonth();
       const anio = ahora.getFullYear();

       // 1. Formatear la Hora
       let textoHora = '';
       switch (formatoHora) {
           case 'g:i a': // 12 Horas sin segundos (ej: 03:45 pm)
               {
                   const ampm = horas >= 12 ? 'pm' : 'am';
                   horas = horas % 12;
                   horas = horas ? horas : 12;
                   const minutosStr = minutos < 10 ? '0' + minutos : minutos;
                   textoHora = `${horas}:${minutosStr} ${ampm}`;
               }
               break;

           case 'h:i:s A': // 12 Horas con segundos (ej: 03:45:10 PM)
               {
                   const ampm = horas >= 12 ? 'PM' : 'AM';
                   horas = horas % 12;
                   horas = horas ? horas : 12;
                   const minutosStr = minutos < 10 ? '0' + minutos : minutos;
                   const segundosStr = segundos < 10 ? '0' + segundos : segundos;
                   textoHora = `${horas}:${minutosStr}:${segundosStr} ${ampm}`;
               }
               break;

           case 'H:i': // 24 Horas sin segundos (ej: 15:45)
               {
                   const horasStr = horas < 10 ? '0' + horas : horas;
                   const minutosStr = minutos < 10 ? '0' + minutos : minutos;
                   textoHora = `${horasStr}:${minutosStr}`;
               }
               break;

           case 'H:i:s': // 24 Horas con segundos (ej: 15:45:30)
           default:
               {
                   const horasStr = horas < 10 ? '0' + horas : horas;
                   const minutosStr = minutos < 10 ? '0' + minutos : minutos;
                   const segundosStr = segundos < 10 ? '0' + segundos : segundos;
                   textoHora = `${horasStr}:${minutosStr}:${segundosStr}`;
               }
               break;
       }

       // 2. Formatear la Fecha según el esquema seleccionado en preferencias
       const nombresMesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
       let textoFecha = '';

       const padZero = (num) => (num < 10 ? '0' + num : num);

       switch (formatoFecha) {
           case 'Y-m-d':
               textoFecha = `${anio}-${padZero(mes + 1)}-${padZero(dia)}`;
               break;
           case 'm/d/Y':
               textoFecha = `${padZero(mes + 1)}/${padZero(dia)}/${anio}`;
               break;
           case 'd-m-Y':
               textoFecha = `${padZero(dia)}-${padZero(mes + 1)}-${anio}`;
               break;
           case 'j M, Y':
               textoFecha = `${dia} ${nombresMesesCortos[mes]}, ${anio}`;
               break;
           case 'd/m/Y':
           default:
               textoFecha = `${padZero(dia)}/${padZero(mes + 1)}/${anio}`;
               break;
       }

       // 3. Inyectar en los elementos de tu contenedor HTML
       if ($('#navbar-reloj-hora').length > 0) {
           $('#navbar-reloj-hora').text(textoHora);
       }
       if ($('#navbar-reloj-fecha').length > 0) {
           $('#navbar-reloj-fecha').text(textoFecha);
       }
   };

   // Ejecutar de inmediato y actualizar cada segundo
   actualizarRelojYFecha();

   if (window._relojInterval) {
       clearInterval(window._relojInterval);
   }
   window._relojInterval = setInterval(actualizarRelojYFecha, 1000);
}
