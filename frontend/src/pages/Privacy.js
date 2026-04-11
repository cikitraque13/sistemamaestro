import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import Logo from '../components/Logo';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[#262626]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="default" />
          <Link to="/" className="text-[#A3A3A3] hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-white mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#A3A3A3]">
          <p className="text-white">
            Última actualización: Abril 2026
          </p>

          <section>
            <h2 className="text-xl text-white mb-3">1. Información que recopilamos</h2>
            <p>
              En Sistema Maestro recopilamos la información que nos proporcionas directamente cuando:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Creas una cuenta (nombre, email)</li>
              <li>Utilizas nuestros servicios (contenido de proyectos, URLs analizadas)</li>
              <li>Te suscribes a nuestra newsletter</li>
              <li>Realizas pagos (procesados de forma segura por Stripe)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">2. Cómo utilizamos tu información</h2>
            <p>
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Procesar transacciones y enviar notificaciones relacionadas</li>
              <li>Responder a tus comentarios, preguntas y solicitudes de soporte</li>
              <li>Enviar comunicaciones técnicas, actualizaciones y mensajes administrativos</li>
              <li>Personalizar y mejorar tu experiencia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">3. Compartición de información</h2>
            <p>
              No vendemos, comercializamos ni transferimos tu información personal a terceros, excepto en los siguientes casos:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Proveedores de servicios que nos ayudan a operar la plataforma (procesamiento de pagos, hosting)</li>
              <li>Cuando sea requerido por ley o para proteger nuestros derechos</li>
              <li>Con tu consentimiento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">4. Seguridad de datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Encriptación de datos en tránsito (HTTPS/TLS)</li>
              <li>Almacenamiento seguro de contraseñas (bcrypt)</li>
              <li>Acceso restringido a datos personales</li>
              <li>Monitorización continua de seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">5. Tus derechos</h2>
            <p>
              Tienes derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Acceder a tus datos personales</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerte al procesamiento de tus datos</li>
              <li>Exportar tus datos (portabilidad)</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, contacta con nosotros en{' '}
              <a href="mailto:privacidad@sistemamaestro.com" className="text-[#0F5257] hover:underline">
                privacidad@sistemamaestro.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">6. Retención de datos</h2>
            <p>
              Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para proporcionarte servicios. Si deseas eliminar tu cuenta, puedes hacerlo desde los ajustes o contactándonos directamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">7. Cambios en esta política</h2>
            <p>
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos cualquier cambio publicando la nueva política en esta página y actualizando la fecha de "última actualización".
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">8. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:
            </p>
            <p className="mt-3">
              <strong className="text-white">Sistema Maestro</strong><br />
              Email:{' '}
              <a href="mailto:hola@sistemamaestro.com" className="text-[#0F5257] hover:underline">
                hola@sistemamaestro.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-8 px-6">
        <div className="max-w-4xl mx-auto text-center text-[#A3A3A3] text-sm">
          © 2026 Sistema Maestro. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
