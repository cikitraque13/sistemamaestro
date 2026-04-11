import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import Logo from '../components/Logo';

const Cookies = () => {
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
        <h1 className="text-3xl font-light text-white mb-8">Política de Cookies</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#A3A3A3]">
          <p className="text-white">
            Última actualización: Abril 2026
          </p>

          <section>
            <h2 className="text-xl text-white mb-3">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente y proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">2. Cookies que utilizamos</h2>
            <p>
              En Sistema Maestro utilizamos los siguientes tipos de cookies:
            </p>
            
            <div className="mt-4 space-y-4">
              <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Cookies esenciales</h3>
                <p className="text-sm">
                  Necesarias para el funcionamiento básico del sitio. Incluyen cookies de sesión y autenticación.
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li><code className="text-[#0F5257]">access_token</code> - Token de autenticación</li>
                  <li><code className="text-[#0F5257]">refresh_token</code> - Token de refresco de sesión</li>
                  <li><code className="text-[#0F5257]">session_token</code> - Sesión de usuario (Google OAuth)</li>
                </ul>
              </div>

              <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Cookies de preferencias</h3>
                <p className="text-sm">
                  Almacenan tus preferencias para mejorar tu experiencia.
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li><code className="text-[#0F5257]">cookies_accepted</code> - Preferencia de consentimiento de cookies</li>
                </ul>
              </div>

              <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Cookies de terceros</h3>
                <p className="text-sm">
                  Utilizadas por servicios de terceros integrados en nuestra plataforma.
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li><strong>Stripe</strong> - Procesamiento de pagos seguros</li>
                  <li><strong>Google</strong> - Autenticación OAuth (opcional)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">3. Duración de las cookies</h2>
            <p>
              Las cookies que utilizamos tienen diferentes duraciones:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Cookies de sesión:</strong> Se eliminan cuando cierras el navegador</li>
              <li><strong>Cookies de autenticación:</strong> Máximo 7 días (refresh token)</li>
              <li><strong>Cookies de preferencias:</strong> Permanentes (hasta que las elimines)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">4. Gestión de cookies</h2>
            <p>
              Puedes controlar y gestionar las cookies de varias formas:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Configuración del navegador:</strong> La mayoría de navegadores te permiten ver, gestionar, borrar y bloquear cookies. Ten en cuenta que si bloqueas todas las cookies, algunas funcionalidades del sitio pueden no funcionar correctamente.
              </li>
              <li>
                <strong>Nuestro banner de cookies:</strong> Puedes aceptar o rechazar las cookies no esenciales cuando visitas nuestro sitio por primera vez.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">5. Cómo eliminar cookies</h2>
            <p>
              Para eliminar las cookies almacenadas en tu dispositivo, consulta la ayuda de tu navegador:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#0F5257] hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener noreferrer" className="text-[#0F5257] hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#0F5257] hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#0F5257] hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">6. Actualizaciones</h2>
            <p>
              Podemos actualizar esta política de cookies ocasionalmente para reflejar cambios en las cookies que usamos. Te recomendamos revisar esta página periódicamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">7. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, contacta con nosotros en{' '}
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

export default Cookies;
