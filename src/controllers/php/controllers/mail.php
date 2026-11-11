<?php
// use PHPMailer\PHPMailer\PHPMailer;
// use PHPMailer\PHPMailer\Exception;

function Enviar_Correo($data) {
    // 1. Cargar la configuración SMTP externa
    // Como este archivo está en src/controllers/php/models/, subimos niveles para llegar a src/
    // (Ajusta la carpeta 'config' si en tu estructura se llama 'cofig')
    $rutaConfig = __DIR__ . '/../../../config/smtp.php'; 

    if (!file_exists($rutaConfig)) {
        JsonResponse::error('El archivo de configuración SMTP no existe en el servidor.', 500, 200);
    }

    $smtpConfig = include $rutaConfig;

    // 2. Validar que la configuración SMTP esté completa y no tenga valores por defecto
    if (
        empty($smtpConfig) || 
        empty($smtpConfig['host']) || 
        $smtpConfig['host'] === 'tu-servidor-smtp.com' ||
        empty($smtpConfig['username']) || 
        $smtpConfig['username'] === 'tu-correo@tudominio.com' ||
        empty($smtpConfig['password']) || 
        $smtpConfig['password'] === 'tu-contraseña-o-token'
    ) {
        JsonResponse::error('El servidor de correo no está configurado. Por favor, actualiza los parámetros en el archivo de configuración SMTP.', 500, 200);
    }

    // 3. Obtener la configuración general enviada desde el cliente
    $destinatarioEmail   = trim($data['destinatario_email'] ?? '');
    $destinatarioNombre  = trim($data['destinatario_nombre'] ?? 'Usuario');
    $asunto              = trim($data['asunto'] ?? 'Notificación del sistema');
    $htmlCrudo           = $data['cuerpo_html'] ?? ''; 
    $variables           = $data['variables'] ?? [];   

    // 4. Validaciones obligatorias de los datos del correo
    if (empty($destinatarioEmail) || !filter_var($destinatarioEmail, FILTER_VALIDATE_EMAIL)) {
        JsonResponse::error('El correo electrónico del destinatario no es válido.', 400, 200);
    }

    if (empty($htmlCrudo)) {
        JsonResponse::error('El cuerpo HTML del correo no puede estar vacío.', 400, 200);
    }

    // 5. Reemplazo automático de variables dinámicas (Ej: {{nombre}} => "Josthin")
    $cuerpoFinal = $htmlCrudo;
    if (is_array($variables) && !empty($variables)) {
        foreach ($variables as $clave => $valor) {
            $cuerpoFinal = str_replace('{{' . $clave . '}}', $valor, $cuerpoFinal);
        }
    }

    // 6. Configuración y Envío mediante PHPMailer usando los datos de config/smtp.php
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $smtpConfig['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtpConfig['username'];
        $mail->Password   = Descifrar_Payload($smtpConfig['password']);
        $mail->SMTPSecure = $smtpConfig['secure'] ?? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $smtpConfig['port'] ?? 587;
        $mail->CharSet    = 'UTF-8';

        // Remitente y Destinatario
        $remitenteEmail = $smtpConfig['from_email'] ?? $smtpConfig['username'];
        $remitenteNombre = $smtpConfig['from_name'] ?? 'Sistema Kirlan';
        
        $mail->setFrom($remitenteEmail, $remitenteNombre);
        $mail->addAddress($destinatarioEmail, $destinatarioNombre);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $cuerpoFinal;

        $mail->send();

        // 7. Respuesta exitosa
        JsonResponse::success('Correo enviado exitosamente.', [
            'destinatario' => $destinatarioEmail
        ], 200);

    } catch (Exception $e) {
        JsonResponse::error('Error al enviar el correo: ' . $mail->ErrorInfo, 500, 200);
    }
}

// Enrutador de acciones
if (isset($_POST['ejecutar']) && $_POST['ejecutar'] === 'enviar_correo') {
    Enviar_Correo($_POST);
}