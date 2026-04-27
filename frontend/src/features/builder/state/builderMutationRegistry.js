import { BUILD_STATUS } from "./builderBuildState";

import {
  BUILDER_ITERATION_INTENT_IDS,
} from "../intelligence/builderIterationInterpreter";

import {
  BUILDER_PROJECT_TYPES,
  BUILDER_PRIMARY_GOALS,
} from "../intelligence/builderProjectClassifier";

export const BUILDER_MUTATION_REGISTRY_VERSION = "builder-mutation-registry-v2-client-landing";

export const CREDIT_TIERS = {
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  PREMIUM: "premium",
};

export const BUILDER_MUTATION_TYPES = {
  ADD_GOOGLE_ACCESS: "add_google_access",
  ADD_SUBSCRIPTION_BOX: "add_subscription_box",
  ADD_GEMA_MAESTRA_SECTION: "add_gema_maestra_section",
  ADD_HOW_IT_WORKS: "add_how_it_works",
  ADD_TRUST_SECTION: "add_trust_section",
  ADD_RESTAURANT_BASE: "add_restaurant_base",
  ADD_BOOKING_FLOW: "add_booking_flow",
  ADD_LEADS_FORM: "add_leads_form",
  ADD_DASHBOARD: "add_dashboard",
  ADD_AUTH_FLOW: "add_auth_flow",
  ADD_API_LAYER: "add_api_layer",
  GENERATE_FOLDER_STRUCTURE: "generate_folder_structure",
  PREPARE_EXPORT_PLAN: "prepare_export_plan",
  IMPROVE_PREMIUM_CONVERSION: "improve_premium_conversion",
};

const creditValues = {
  [CREDIT_TIERS.NONE]: 0,
  [CREDIT_TIERS.LOW]: 1,
  [CREDIT_TIERS.MEDIUM]: 2,
  [CREDIT_TIERS.HIGH]: 4,
  [CREDIT_TIERS.PREMIUM]: 8,
};

const INTERNAL_MUTATION_TYPES = [
  BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
  BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
  BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
  BUILDER_MUTATION_TYPES.ADD_API_LAYER,
  BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
];

const CLIENT_LANDING_MUTATION_TYPES = [
  BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
  BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
  BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
];

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const includesAny = (text = "", terms = []) => {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
};

const creditEstimate = (tier, reason) => ({
  tier,
  credits: creditValues[tier] || 0,
  reason,
});

const block = (id, type, label, order, props = {}) => ({
  id,
  type,
  label,
  order,
  status: "active",
  source: "mutation",
  props,
});

const folder = (path, description = "") => ({ path, description });

const file = ({
  path,
  type = "file",
  language = "javascript",
  description = "",
  content = "",
}) => ({
  path,
  type,
  language,
  description,
  content,
});

const component = (id, name, filePath, type = "component") => ({
  id,
  name,
  type,
  filePath,
});

const route = (path, label, componentName = "") => ({
  path,
  label,
  component: componentName,
});

const cta = (id, label, href = "/", intent = "primary") => ({
  id,
  label,
  href,
  intent,
});

const cleanActionTypes = (types = []) =>
  Array.from(new Set(types.filter(Boolean))).filter(
    (type) => !INTERNAL_MUTATION_TYPES.includes(type)
  );

const nextActions = (types = []) =>
  cleanActionTypes(types).map((type, index) => ({
    id: `next-${type}`,
    type,
    label: getBuilderMutationLabel(type),
    description: getBuilderMutation(type)?.description || "",
    creditTier: getBuilderMutationCreditTier(type),
    priority: 10 + index,
  }));

const defineMutation = ({
  type,
  label,
  description,
  matchers = [],
  creditTier = CREDIT_TIERS.NONE,
  build,
}) => ({
  type,
  label,
  description,
  matchers,
  creditTier,
  build,
});

export const BUILDER_MUTATION_REGISTRY = {
  [BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
    label: "Preparar acceso con Google",
    description: "Prepara autenticaciÃ³n con Google como capacidad interna, no como bloque de landing.",
    matchers: ["google", "entrar con google", "login con google", "acceso google", "signin google"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
      label: "Preparar acceso con Google",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      components: [
        component("google-access-card", "GoogleAccessCard", "src/components/auth/GoogleAccessCard.jsx"),
      ],
      folders: [folder("src/components/auth", "Componentes de autenticaciÃ³n.")],
      files: [
        file({
          path: "src/components/auth/GoogleAccessCard.jsx",
          type: "component",
          description: "Componente interno para acceso con Google.",
          content:
            "export function GoogleAccessCard(){ return <button>Entrar con Google</button>; }",
        }),
      ],
      ctas: [cta("cta-google-access", "Entrar con Google", "/", "auth")],
      codeModel: { entryFile: "src/components/auth/GoogleAccessCard.jsx" },
      structureModel: {
        folders: ["src/components/auth"],
        files: ["src/components/auth/GoogleAccessCard.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Preparar componente de acceso con Google."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
    label: "AÃ±adir captaciÃ³n por email",
    description: "AÃ±ade un bloque de captaciÃ³n por email orientado a pacientes o clientes.",
    matchers: ["suscribete", "suscrÃ­bete", "newsletter", "suscripcion", "suscripciÃ³n", "email", "mail", "correo"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
      label: "AÃ±adir captaciÃ³n por email",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("email-capture", "lead_capture", "CaptaciÃ³n por email", 30, {
          title: "Recibe informaciÃ³n antes de reservar",
          subtitle: "DÃ©janos tu email y te enviaremos disponibilidad, detalles del servicio y prÃ³ximos pasos.",
          placeholder: "tu@email.com",
          buttonLabel: "Enviar informaciÃ³n",
        }),
      ],
      components: [
        component("email-capture-box", "EmailCaptureBox", "src/components/conversion/EmailCaptureBox.jsx"),
      ],
      folders: [folder("src/components/conversion", "Componentes de conversiÃ³n y captaciÃ³n.")],
      files: [
        file({
          path: "src/components/conversion/EmailCaptureBox.jsx",
          type: "component",
          description: "Bloque de captaciÃ³n por email.",
          content:
            "export function EmailCaptureBox(){ return <section><h2>Recibe informaciÃ³n antes de reservar</h2><input placeholder='tu@email.com'/><button>Enviar informaciÃ³n</button></section>; }",
        }),
      ],
      ctas: [cta("cta-email-capture", "Enviar informaciÃ³n", "/", "lead")],
      previewModel: { activeSectionId: "email-capture" },
      codeModel: { entryFile: "src/components/conversion/EmailCaptureBox.jsx" },
      structureModel: {
        folders: ["src/components/conversion"],
        files: ["src/components/conversion/EmailCaptureBox.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "AÃ±adir captaciÃ³n de leads por email."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
    label: "Preparar monetizaciÃ³n por crÃ©ditos",
    description: "Registra Gema Maestra como capacidad interna de monetizaciÃ³n, no como bloque visual de landing.",
    matchers: ["gema", "gema maestra", "creditos", "crÃ©ditos", "bonus"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
      label: "Preparar monetizaciÃ³n por crÃ©ditos",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      folders: [folder("src/components/credits", "Componentes internos de crÃ©ditos.")],
      files: [
        file({
          path: "src/components/credits/CreditsBadge.jsx",
          type: "component",
          description: "Indicador interno de crÃ©ditos.",
          content:
            "export function CreditsBadge(){ return <aside>CrÃ©ditos disponibles</aside>; }",
        }),
      ],
      structureModel: {
        folders: ["src/components/credits"],
        files: ["src/components/credits/CreditsBadge.jsx"],
      },
      codeModel: { entryFile: "src/components/credits/CreditsBadge.jsx" },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Preparar monetizaciÃ³n interna por crÃ©ditos."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
    label: "AÃ±adir proceso de cliente",
    description: "Explica el proceso del negocio desde la solicitud hasta la cita o contacto.",
    matchers: ["como funciona", "cÃ³mo funciona", "pasos", "proceso", "explicar"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
      label: "AÃ±adir proceso de cliente",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("client-process", "process", "Proceso", 50, {
          title: "CÃ³mo serÃ¡ tu primera visita",
          steps: [
            "CuÃ©ntanos quÃ© tratamiento o servicio necesitas.",
            "Revisamos tu caso y resolvemos tus dudas.",
            "Confirmamos la cita y el siguiente paso contigo.",
          ],
        }),
      ],
      components: [
        component("client-process-section", "ClientProcessSection", "src/components/sections/ClientProcessSection.jsx"),
      ],
      folders: [folder("src/components/sections", "Secciones reutilizables.")],
      files: [
        file({
          path: "src/components/sections/ClientProcessSection.jsx",
          type: "component",
          description: "SecciÃ³n de proceso para cliente.",
          content:
            "export function ClientProcessSection(){ return <section><h2>CÃ³mo serÃ¡ tu primera visita</h2><ol><li>CuÃ©ntanos quÃ© necesitas.</li><li>Revisamos tu caso.</li><li>Confirmamos tu cita.</li></ol></section>; }",
        }),
      ],
      previewModel: { activeSectionId: "client-process" },
      codeModel: { entryFile: "src/components/sections/ClientProcessSection.jsx" },
      structureModel: {
        folders: ["src/components/sections"],
        files: ["src/components/sections/ClientProcessSection.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "AÃ±adir explicaciÃ³n del proceso de cliente."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    label: "AÃ±adir bloque de confianza",
    description: "AÃ±ade prueba, autoridad y seguridad para mejorar conversiÃ³n.",
    matchers: ["confianza", "reseÃ±as", "resenas", "testimonios", "autoridad", "garantia", "garantÃ­a", "seguridad", "medica", "mÃ©dica", "experiencia"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      label: "AÃ±adir bloque de confianza",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("trust-section", "trust", "Confianza", 60, {
          title: "Confianza mÃ©dica desde la primera visita",
          points: ["Equipo especializado", "TecnologÃ­a avanzada", "Seguimiento cercano"],
        }),
      ],
      components: [
        component("trust-section", "TrustSection", "src/components/sections/TrustSection.jsx"),
      ],
      folders: [folder("src/components/sections", "Secciones reutilizables.")],
      files: [
        file({
          path: "src/components/sections/TrustSection.jsx",
          type: "component",
          description: "SecciÃ³n de confianza.",
          content:
            "export function TrustSection(){ return <section><h2>Confianza mÃ©dica desde la primera visita</h2><ul><li>Equipo especializado</li><li>TecnologÃ­a avanzada</li><li>Seguimiento cercano</li></ul></section>; }",
        }),
      ],
      previewModel: { activeSectionId: "trust-section" },
      codeModel: { entryFile: "src/components/sections/TrustSection.jsx" },
      structureModel: {
        folders: ["src/components/sections"],
        files: ["src/components/sections/TrustSection.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "AÃ±adir bloque de confianza."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE,
    label: "Crear base de restaurante",
    description: "Crea hero, carta, reservas y ubicaciÃ³n para restaurante.",
    matchers: ["restaurante", "bar", "cafeteria", "cafeterÃ­a", "menu", "menÃº", "carta"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE,
      label: "Crear base de restaurante",
      source,
      projectKind: "restaurant_landing",
      sector: "restaurant",
      objective: "reservations",
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("restaurant-hero", "hero", "Hero restaurante", 10, {
          title: "Reserva una experiencia gastronÃ³mica memorable",
          subtitle: "Carta cuidada, ambiente cercano y reserva directa en pocos pasos.",
          buttonLabel: "Reservar mesa",
        }),
        block("restaurant-menu", "menu", "Carta destacada", 20, {
          title: "Carta destacada",
          items: ["Entrantes", "Platos principales", "Postres", "Bebidas"],
        }),
        block("restaurant-location", "location", "UbicaciÃ³n", 40, {
          title: "Estamos cerca de ti",
          subtitle: "Consulta ubicaciÃ³n y horario antes de reservar.",
        }),
      ],
      components: [
        component("restaurant-landing", "RestaurantLanding", "src/pages/RestaurantLanding.jsx", "page"),
      ],
      folders: [
        folder("src/pages", "PÃ¡ginas principales."),
        folder("src/components/restaurant", "Componentes de restaurante."),
      ],
      files: [
        file({
          path: "src/pages/RestaurantLanding.jsx",
          type: "page",
          description: "Landing inicial de restaurante.",
          content:
            "export function RestaurantLanding(){ return <main><h1>Reserva una experiencia gastronÃ³mica memorable</h1><button>Reservar mesa</button></main>; }",
        }),
      ],
      ctas: [cta("cta-book-table", "Reservar mesa", "/", "booking")],
      routes: [route("/", "Restaurante", "RestaurantLanding")],
      previewModel: {
        layout: "restaurant_landing",
        activeSectionId: "restaurant-hero",
      },
      codeModel: { entryFile: "src/pages/RestaurantLanding.jsx" },
      structureModel: {
        folders: ["src/pages", "src/components/restaurant"],
        files: ["src/pages/RestaurantLanding.jsx"],
        routes: ["/"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Crear base visible de restaurante."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
    label: "AÃ±adir sistema de citas",
    description: "AÃ±ade estructura de reserva, CTA y componente inicial para citas o solicitudes.",
    matchers: ["reserva", "reservas", "citas", "cita", "agenda", "booking", "pedir cita", "solicitar cita"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      label: "AÃ±adir sistema de citas",
      source,
      objective: "booking",
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("booking-flow", "booking", "Reserva de cita", 35, {
          title: "Reserva tu primera valoraciÃ³n",
          fields: ["nombre", "telÃ©fono", "tratamiento", "fecha preferida"],
          buttonLabel: "Solicitar cita",
        }),
      ],
      components: [
        component("booking-form", "BookingForm", "src/components/booking/BookingForm.jsx"),
      ],
      folders: [folder("src/components/booking", "Componentes de reserva.")],
      files: [
        file({
          path: "src/components/booking/BookingForm.jsx",
          type: "component",
          description: "Formulario inicial de citas.",
          content:
            "export function BookingForm(){ return <form><input placeholder='Nombre'/><input placeholder='TelÃ©fono'/><input placeholder='Tratamiento'/><button>Solicitar cita</button></form>; }",
        }),
      ],
      ctas: [cta("cta-confirm-booking", "Solicitar cita", "/", "booking")],
      previewModel: { activeSectionId: "booking-flow" },
      codeModel: { entryFile: "src/components/booking/BookingForm.jsx" },
      structureModel: {
        folders: ["src/components/booking"],
        files: ["src/components/booking/BookingForm.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "AÃ±adir reservas visibles."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    label: "AÃ±adir formulario de captaciÃ³n",
    description: "AÃ±ade formulario de captaciÃ³n para clÃ­nicas, servicios y negocios locales.",
    matchers: ["leads", "contacto", "formulario", "captar", "clientes", "presupuesto", "solicitud", "valoracion", "valoraciÃ³n"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      label: "AÃ±adir formulario de captaciÃ³n",
      source,
      objective: "lead_generation",
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("lead-form", "lead_form", "Formulario de contacto", 45, {
          title: "CuÃ©ntanos quÃ© necesitas",
          fields: ["nombre", "email", "telÃ©fono", "mensaje"],
          buttonLabel: "Solicitar informaciÃ³n",
        }),
      ],
      components: [
        component("lead-form", "LeadForm", "src/components/conversion/LeadForm.jsx"),
      ],
      folders: [folder("src/components/conversion", "Componentes de conversiÃ³n.")],
      files: [
        file({
          path: "src/components/conversion/LeadForm.jsx",
          type: "component",
          description: "Formulario de captaciÃ³n de leads.",
          content:
            "export function LeadForm(){ return <form><input placeholder='Nombre'/><input placeholder='Email'/><input placeholder='TelÃ©fono'/><textarea placeholder='Mensaje'/><button>Solicitar informaciÃ³n</button></form>; }",
        }),
      ],
      previewModel: { activeSectionId: "lead-form" },
      codeModel: { entryFile: "src/components/conversion/LeadForm.jsx" },
      structureModel: {
        folders: ["src/components/conversion"],
        files: ["src/components/conversion/LeadForm.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "AÃ±adir formulario de captaciÃ³n."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_DASHBOARD]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
    label: "Preparar dashboard interno",
    description: "AÃ±ade estructura inicial de dashboard para app o SaaS. No se usa como bloque de landing.",
    matchers: ["dashboard", "panel", "area privada", "Ã¡rea privada"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
      label: "Preparar dashboard interno",
      source,
      projectKind: "app",
      creditTier: CREDIT_TIERS.HIGH,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      components: [
        component("dashboard-page", "DashboardPage", "src/pages/DashboardPage.jsx", "page"),
      ],
      folders: [
        folder("src/pages", "PÃ¡ginas principales."),
        folder("src/components/dashboard", "Componentes del dashboard."),
      ],
      files: [
        file({
          path: "src/pages/DashboardPage.jsx",
          type: "page",
          description: "PÃ¡gina inicial de dashboard.",
          content:
            "export function DashboardPage(){ return <main><h1>Panel principal</h1><section>Actividad Â· Proyectos Â· PrÃ³ximas acciones</section></main>; }",
        }),
      ],
      routes: [route("/dashboard", "Dashboard", "DashboardPage")],
      codeModel: { entryFile: "src/pages/DashboardPage.jsx" },
      structureModel: {
        folders: ["src/pages", "src/components/dashboard"],
        files: ["src/pages/DashboardPage.jsx"],
        routes: ["/dashboard"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "Preparar dashboard inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
    label: "Preparar autenticaciÃ³n",
    description: "AÃ±ade estructura de login, registro y callback. No se usa como bloque de landing.",
    matchers: ["auth", "autenticacion", "autenticaciÃ³n", "login", "registro", "register"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
      label: "Preparar autenticaciÃ³n",
      source,
      creditTier: CREDIT_TIERS.HIGH,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      folders: [
        folder("src/features/auth", "MÃ³dulo de autenticaciÃ³n."),
        folder("src/features/auth/pages", "Pantallas de acceso."),
      ],
      files: [
        file({
          path: "src/features/auth/pages/LoginPage.jsx",
          type: "page",
          description: "Pantalla de login.",
          content:
            "export function LoginPage(){ return <main><h1>Entrar</h1><button>Entrar con Google</button></main>; }",
        }),
        file({
          path: "src/features/auth/pages/RegisterPage.jsx",
          type: "page",
          description: "Pantalla de registro.",
          content:
            "export function RegisterPage(){ return <main><h1>Crear cuenta</h1><button>Crear cuenta con Google</button></main>; }",
        }),
      ],
      routes: [
        route("/login", "Login", "LoginPage"),
        route("/register", "Registro", "RegisterPage"),
      ],
      structureModel: {
        folders: ["src/features/auth", "src/features/auth/pages"],
        files: ["src/features/auth/pages/LoginPage.jsx", "src/features/auth/pages/RegisterPage.jsx"],
        routes: ["/login", "/register"],
      },
      codeModel: { entryFile: "src/features/auth/pages/LoginPage.jsx" },
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "Preparar autenticaciÃ³n inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_API_LAYER]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_API_LAYER,
    label: "AÃ±adir capa API",
    description: "Prepara rutas API y estructura backend inicial.",
    matchers: ["api", "backend", "endpoint", "fastapi", "servidor", "base de datos"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      label: "AÃ±adir capa API",
      source,
      creditTier: CREDIT_TIERS.HIGH,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      folders: [
        folder("backend/app/routers", "Rutas API."),
        folder("backend/app/services", "Servicios backend."),
        folder("backend/app/schemas", "Contratos de datos."),
      ],
      files: [
        file({
          path: "backend/app/routers/leads.py",
          type: "api_route",
          language: "python",
          description: "Router inicial de leads.",
          content:
            "from fastapi import APIRouter\n\nrouter = APIRouter(prefix='/leads', tags=['leads'])\n\n@router.post('/')\ndef create_lead():\n    return {'ok': True}\n",
        }),
      ],
      apiRoutes: [route("/api/leads", "Leads API", "leads_router")],
      structureModel: {
        folders: ["backend/app/routers", "backend/app/services", "backend/app/schemas"],
        files: ["backend/app/routers/leads.py"],
        apiRoutes: ["/api/leads"],
      },
      codeModel: {
        framework: "fastapi",
        language: "python",
        entryFile: "backend/app/routers/leads.py",
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "AÃ±adir API inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE]: defineMutation({
    type: BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    label: "Generar estructura de proyecto",
    description: "Genera estructura frontend/backend coherente.",
    matchers: ["estructura", "carpetas", "archivos", "arquitectura", "frontend", "backend"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      label: "Generar estructura de proyecto",
      source,
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.STRUCTURE_READY,
      folders: [
        folder("src", "Fuente frontend."),
        folder("src/components", "Componentes reutilizables."),
        folder("src/components/booking", "Componentes de reserva."),
        folder("src/components/conversion", "Componentes de conversiÃ³n."),
        folder("src/components/sections", "Secciones de landing."),
        folder("src/pages", "PÃ¡ginas."),
        folder("backend/app", "AplicaciÃ³n backend."),
        folder("backend/app/routers", "Rutas API."),
        folder("backend/app/services", "Servicios backend."),
      ],
      files: [
        file({
          path: "src/App.jsx",
          type: "entry",
          description: "Entrada frontend.",
          content:
            "export default function App(){ return <main><h1>Landing premium para captar citas</h1><p>Servicios, confianza y reserva en una sola experiencia.</p><button>Solicitar cita</button></main>; }",
        }),
        file({
          path: "backend/app/main.py",
          type: "entry",
          language: "python",
          description: "Entrada backend.",
          content: "from fastapi import FastAPI\n\napp = FastAPI(title='Generated App')\n",
        }),
      ],
      structureModel: {
        folders: [
          "src",
          "src/components",
          "src/components/booking",
          "src/components/conversion",
          "src/components/sections",
          "src/pages",
          "backend/app",
          "backend/app/routers",
          "backend/app/services",
        ],
        files: ["src/App.jsx", "backend/app/main.py"],
      },
      codeModel: { entryFile: "src/App.jsx" },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Generar estructura base."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN]: defineMutation({
    type: BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
    label: "Preparar plan de exportaciÃ³n",
    description: "Prepara salida profesional sin ejecutar exportaciÃ³n todavÃ­a.",
    matchers: ["exportar", "sacar", "descargar", "zip", "github", "transferir"],
    creditTier: CREDIT_TIERS.PREMIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
      label: "Preparar plan de exportaciÃ³n",
      source,
      creditTier: CREDIT_TIERS.PREMIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      folders: [folder("export", "PreparaciÃ³n conceptual de salida.")],
      files: [
        file({
          path: "export/README.md",
          type: "documentation",
          language: "markdown",
          description: "Plan inicial de exportaciÃ³n.",
          content: "# ExportaciÃ³n\n\nPendiente de valoraciÃ³n, empaquetado y entrega profesional.\n",
        }),
      ],
      structureModel: {
        folders: ["export"],
        files: ["export/README.md"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.PREMIUM, "Preparar salida profesional."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION]: defineMutation({
    type: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    label: "Mejorar conversiÃ³n premium",
    description: "Refuerza propuesta de valor, CTA y narrativa de conversiÃ³n.",
    matchers: ["premium", "conversion", "conversiÃ³n", "vender", "cta", "mejorar landing", "mÃ¡s potente", "mas potente"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      label: "Mejorar conversiÃ³n premium",
      source,
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("premium-conversion", "conversion", "ConversiÃ³n premium", 25, {
          title: "Consigue mÃ¡s citas con una landing premium",
          subtitle: "Presenta servicios, confianza mÃ©dica y una llamada clara para pedir cita.",
          buttonLabel: "Pedir cita",
        }),
      ],
      ctas: [cta("cta-create-project", "Pedir cita", "/", "primary_conversion")],
      previewModel: { activeSectionId: "premium-conversion" },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Mejorar conversiÃ³n principal."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
      ]),
    }),
  }),
};

const intentMutationMap = {
  [BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE]: [BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION],
  [BUILDER_ITERATION_INTENT_IDS.CLARIFY]: [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS],
  [BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION]: [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
    BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  ],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_CTA]: [BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION],
  [BUILDER_ITERATION_INTENT_IDS.CHANGE_STRUCTURE]: [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE],
  [BUILDER_ITERATION_INTENT_IDS.ADD_TRUST]: [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION],
  [BUILDER_ITERATION_INTENT_IDS.TECHNICAL_OUTPUT]: [
    BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    BUILDER_MUTATION_TYPES.ADD_API_LAYER,
  ],
};

const projectTypeMutationMap = {
  [BUILDER_PROJECT_TYPES.LOCAL_RESERVATION_PAGE]: [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
    BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  ],
  [BUILDER_PROJECT_TYPES.SAAS_LANDING]: [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
  ],
  [BUILDER_PROJECT_TYPES.AI_TOOL]: [
    BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
  ],
  [BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW]: [
    BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    BUILDER_MUTATION_TYPES.ADD_API_LAYER,
  ],
};

const goalMutationMap = {
  [BUILDER_PRIMARY_GOALS.BOOK_RESERVATION]: [
    BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
    BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  ],
  [BUILDER_PRIMARY_GOALS.CAPTURE_LEADS]: [
    BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
  ],
  [BUILDER_PRIMARY_GOALS.ACTIVATE_REGISTRATION]: [BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW],
};

export function getBuilderMutation(type) {
  return BUILDER_MUTATION_REGISTRY[type] || null;
}

export function getBuilderMutationLabel(type) {
  return getBuilderMutation(type)?.label || String(type || "");
}

export function getBuilderMutationCreditTier(type) {
  return getBuilderMutation(type)?.creditTier || CREDIT_TIERS.NONE;
}

export function getAllBuilderMutations() {
  return Object.values(BUILDER_MUTATION_REGISTRY);
}

export function resolveBuilderMutationTypesFromInput(input = "") {
  if (
    includesAny(input, [
      "dental",
      "dentista",
      "odontologia",
      "odontologÃ­a",
      "clinica dental",
      "clÃ­nica dental",
      "implantes",
      "implante",
      "ortodoncia",
      "estÃ©tica dental",
      "estetica dental",
      "sonrisa",
    ])
  ) {
    return [
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    ];
  }

  if (
    includesAny(input, [
      "estetica",
      "estÃ©tica",
      "medicina estetica",
      "medicina estÃ©tica",
      "belleza",
      "rejuvenecimiento",
      "facial",
      "botox",
    ])
  ) {
    return [
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    ];
  }

  if (includesAny(input, ["restaurante", "bar", "cafeteria", "cafeterÃ­a", "menu", "menÃº", "carta"])) {
    return [
      BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE,
      BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    ];
  }

  if (includesAny(input, ["app", "saas", "dashboard", "aplicacion", "aplicaciÃ³n"])) {
    return [
      BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    ];
  }

  if (includesAny(input, ["login", "registro", "auth", "autenticacion", "autenticaciÃ³n"])) {
    return [
      BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
      BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
    ];
  }

  if (includesAny(input, ["api", "backend", "endpoint", "base de datos", "fastapi"])) {
    return [
      BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      BUILDER_MUTATION_TYPES.ADD_API_LAYER,
    ];
  }

  if (includesAny(input, ["landing", "web", "pagina", "pÃ¡gina", "servicio", "negocio", "cliente", "clientes"])) {
    return [
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    ];
  }

  const directMatches = getAllBuilderMutations()
    .filter((definition) => includesAny(input, definition.matchers))
    .map((definition) => definition.type)
    .filter((type) => !INTERNAL_MUTATION_TYPES.includes(type));

  if (directMatches.length) {
    return Array.from(new Set(directMatches));
  }

  return CLIENT_LANDING_MUTATION_TYPES;
}

export function resolveBuilderMutationTypesFromKnowledge(knowledge = {}) {
  const types = [];

  const input = [
    knowledge.rawInput,
    knowledge.message,
    knowledge.intentSummary,
    knowledge.hubSummary?.primaryCTA,
    knowledge.hubSummary?.conversionTarget,
    knowledge.iterationSummary?.cta,
    knowledge.iterationSummary?.primaryIntent,
  ]
    .filter(Boolean)
    .join(" ");

  types.push(...resolveBuilderMutationTypesFromInput(input));

  const projectType = knowledge.classificationSummary?.projectType || knowledge.hubSummary?.projectType;
  const primaryGoal = knowledge.classificationSummary?.primaryGoal;

  if (projectTypeMutationMap[projectType]) {
    types.push(...projectTypeMutationMap[projectType]);
  }

  if (goalMutationMap[primaryGoal]) {
    types.push(...goalMutationMap[primaryGoal]);
  }

  const iterationIntent = knowledge.iterationSummary?.primaryIntent;

  if (intentMutationMap[iterationIntent]) {
    types.push(...intentMutationMap[iterationIntent]);
  }

  return cleanActionTypes(types);
}

export function buildMutationFromType(type, context = {}) {
  const definition = getBuilderMutation(type);

  if (!definition || typeof definition.build !== "function") {
    return null;
  }

  return definition.build(context);
}

export function buildMutationsFromInput(input = "", context = {}) {
  return resolveBuilderMutationTypesFromInput(input)
    .map((type) => buildMutationFromType(type, context))
    .filter(Boolean);
}

export function buildMutationsFromKnowledge(knowledge = {}, context = {}) {
  return resolveBuilderMutationTypesFromKnowledge(knowledge)
    .map((type) => buildMutationFromType(type, context))
    .filter(Boolean);
}

export function getInitialAvailableBuilderActions(input = "") {
  return resolveBuilderMutationTypesFromInput(input).map((type, index) => ({
    id: `initial-${type}`,
    type,
    label: getBuilderMutationLabel(type),
    description: getBuilderMutation(type)?.description || "",
    creditTier: getBuilderMutationCreditTier(type),
    priority: 10 + index,
  }));
}