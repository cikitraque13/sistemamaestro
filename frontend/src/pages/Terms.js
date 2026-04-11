import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import Logo from '../components/Logo';

const Terms = () => {
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
        <h1 className="text-3xl font-light text-white mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#A3A3A3]">
          <p className="text-white">
            Última actualización: Abril 2026
          </p>

          <section>
            <h2 className="text-xl text-white mb-3">1. Aceptación de los términos</h2>
            <p>
              Al acceder y utilizar Sistema Maestro ("el Servicio"), aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">2. Descripción del servicio</h2>
            <p>
              Sistema Maestro es una plataforma de transformación digital que proporciona:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Análisis de necesidades y activos digitales</li>
              <li>Diagnósticos y recomendaciones personalizadas</li>
              <li>Blueprints y planes de acción</li>
              <li>Herramientas de planificación de proyectos digitales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">3. Registro y cuentas</h2>
            <p>
              Para acceder a ciertas funcionalidades, debes crear una cuenta. Te comprometes a:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Proporcionar información precisa y actualizada</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>Notificarnos inmediatamente cualquier uso no autorizado de tu cuenta</li>
              <li>Ser responsable de toda actividad que ocurra bajo tu cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">4. Planes y pagos</h2>
            <p>
              Sistema Maestro ofrece diferentes planes de suscripción:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Gratis:</strong> Acceso limitado a funcionalidades básicas</li>
              <li><strong>Blueprint (€29/mes):</strong> Acceso a estructuras completas y prioridades</li>
              <li><strong>Sistema (€79/mes):</strong> Continuidad guiada y activación</li>
              <li><strong>Premium (€199/mes):</strong> Soporte prioritario y acceso completo</li>
            </ul>
            <p className="mt-3">
              Los pagos se procesan de forma segura a través de Stripe. Al suscribirte a un plan de pago, autorizas cargos recurrentes mensuales hasta que canceles tu suscripción.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">5. Cancelación y reembolsos</h2>
            <p>
              Puedes cancelar tu suscripción en cualquier momento desde tu panel de facturación. Al cancelar:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Mantendrás acceso hasta el final del período de facturación actual</li>
              <li>No se realizarán más cargos automáticos</li>
              <li>No se emiten reembolsos por períodos parciales no utilizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">6. Propiedad intelectual</h2>
            <p>
              Todo el contenido, diseño, código y materiales de Sistema Maestro son propiedad exclusiva nuestra o de nuestros licenciantes. Se te concede una licencia limitada, no exclusiva y no transferible para usar el Servicio según estos términos.
            </p>
            <p className="mt-3">
              El contenido que generes (proyectos, datos de entrada) sigue siendo de tu propiedad. Nos otorgas una licencia para procesar este contenido únicamente con el fin de proporcionarte el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">7. Uso aceptable</h2>
            <p>
              Te comprometes a no:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Usar el Servicio para fines ilegales o no autorizados</li>
              <li>Intentar acceder a sistemas o datos de otros usuarios</li>
              <li>Transmitir malware, virus o código malicioso</li>
              <li>Realizar scraping o extracción automatizada de datos</li>
              <li>Revender o sublicenciar el acceso al Servicio</li>
              <li>Interferir con el funcionamiento del Servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">8. Limitación de responsabilidad</h2>
            <p>
              El Servicio se proporciona "tal cual" y "según disponibilidad". No garantizamos que:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>El Servicio estará disponible de forma ininterrumpida</li>
              <li>Los diagnósticos y recomendaciones serán completos o libres de errores</li>
              <li>Los resultados obtenidos al usar el Servicio cumplirán tus expectativas</li>
            </ul>
            <p className="mt-3">
              En ningún caso seremos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">9. Modificaciones del servicio</h2>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del Servicio en cualquier momento, con o sin previo aviso. Esto incluye cambios en funcionalidades, precios y planes.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">10. Modificaciones de los términos</h2>
            <p>
              Podemos modificar estos términos ocasionalmente. Te notificaremos de cambios significativos por email o mediante un aviso destacado en el Servicio. El uso continuado del Servicio tras los cambios constituye tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">11. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de España. Cualquier disputa se someterá a los tribunales competentes de España.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white mb-3">12. Contacto</h2>
            <p>
              Para cualquier consulta sobre estos términos, contacta con nosotros en:
            </p>
            <p className="mt-3">
              <strong className="text-white">Sistema Maestro</strong><br />
              Email:{' '}
              <a href="mailto:legal@sistemamaestro.com" className="text-[#0F5257] hover:underline">
                legal@sistemamaestro.com
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

export default Terms;
