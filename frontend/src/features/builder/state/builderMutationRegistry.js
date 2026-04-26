import { BUILD_STATUS } from "./builderBuildState";

import {
  BUILDER_ITERATION_INTENT_IDS,
} from "../intelligence/builderIterationInterpreter";

import {
  BUILDER_PROJECT_TYPES,
  BUILDER_PRIMARY_GOALS,
} from "../intelligence/builderProjectClassifier";

export const BUILDER_MUTATION_REGISTRY_VERSION = "builder-mutation-registry-v1";

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

const nextActions = (types = []) =>
  types.map((type, index) => ({
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
    label: "Añadir acceso con Google",
    description: "Añade un bloque visible de acceso con Google y prepara estructura de autenticación.",
    matchers: ["google", "entrar con google", "login con google", "acceso google", "signin google"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
      label: "Añadir acceso con Google",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("google-access", "auth", "Acceso con Google", 20, {
          title: "Entra con Google",
          subtitle: "Accede a Sistema Maestro y continúa tu proyecto sin fricción.",
          buttonLabel: "Entrar con Google",
        }),
      ],
      components: [
        component("google-access-card", "GoogleAccessCard", "src/components/auth/GoogleAccessCard.jsx"),
      ],
      folders: [folder("src/components/auth", "Componentes de autenticación.")],
      files: [
        file({
          path: "src/components/auth/GoogleAccessCard.jsx",
          type: "component",
          description: "Componente visual para acceso con Google.",
          content:
            "export function GoogleAccessCard(){ return <section><h2>Entra con Google</h2><button>Entrar con Google</button></section>; }",
        }),
      ],
      ctas: [cta("cta-google-access", "Entrar con Google", "/", "auth")],
      previewModel: { activeSectionId: "google-access" },
      codeModel: { entryFile: "src/components/auth/GoogleAccessCard.jsx" },
      structureModel: {
        folders: ["src/components/auth"],
        files: ["src/components/auth/GoogleAccessCard.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Añadir componente y bloque de acceso con Google."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
        BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
    label: "Añadir bloque de suscripción",
    description: "Añade un recuadro de suscripción para captación.",
    matchers: ["suscribete", "suscríbete", "newsletter", "suscripcion", "suscripción", "email"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
      label: "Añadir bloque de suscripción",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("subscription-box", "lead_capture", "Suscripción", 30, {
          title: "Recibe ideas para construir mejor",
          subtitle: "Déjanos tu email y sigue recibiendo mejoras de Sistema Maestro.",
          placeholder: "tu@email.com",
          buttonLabel: "Suscribirme",
        }),
      ],
      components: [
        component("subscription-box", "SubscriptionBox", "src/components/conversion/SubscriptionBox.jsx"),
      ],
      folders: [folder("src/components/conversion", "Componentes de conversión y captación.")],
      files: [
        file({
          path: "src/components/conversion/SubscriptionBox.jsx",
          type: "component",
          description: "Bloque de suscripción.",
          content:
            "export function SubscriptionBox(){ return <section><h2>Recibe ideas para construir mejor</h2><input placeholder='tu@email.com'/><button>Suscribirme</button></section>; }",
        }),
      ],
      ctas: [cta("cta-subscribe", "Suscribirme", "/", "lead")],
      previewModel: { activeSectionId: "subscription-box" },
      codeModel: { entryFile: "src/components/conversion/SubscriptionBox.jsx" },
      structureModel: {
        folders: ["src/components/conversion"],
        files: ["src/components/conversion/SubscriptionBox.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Añadir captación de leads."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
    label: "Añadir sección Gema Maestra",
    description: "Añade sección de créditos, bonus o ventaja operativa.",
    matchers: ["gema", "gema maestra", "creditos", "créditos", "bonus"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
      label: "Añadir sección Gema Maestra",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("gema-maestra", "credits_value", "Gema Maestra", 40, {
          title: "Gema Maestra incluida",
          subtitle: "Empieza con créditos para probar construcción real dentro de Sistema Maestro.",
          badge: "Bonus inicial",
        }),
      ],
      components: [
        component("gema-maestra-card", "GemaMaestraCard", "src/components/credits/GemaMaestraCard.jsx"),
      ],
      folders: [folder("src/components/credits", "Componentes de créditos.")],
      files: [
        file({
          path: "src/components/credits/GemaMaestraCard.jsx",
          type: "component",
          description: "Bloque visual de Gema Maestra.",
          content:
            "export function GemaMaestraCard(){ return <section><span>Bonus inicial</span><h2>Gema Maestra incluida</h2><p>Empieza con créditos para probar construcción real.</p></section>; }",
        }),
      ],
      previewModel: { activeSectionId: "gema-maestra" },
      codeModel: { entryFile: "src/components/credits/GemaMaestraCard.jsx" },
      structureModel: {
        folders: ["src/components/credits"],
        files: ["src/components/credits/GemaMaestraCard.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Añadir valor de créditos iniciales."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
    label: "Añadir sección Cómo funciona",
    description: "Explica en pasos simples cómo el sistema entiende, activa y construye.",
    matchers: ["como funciona", "cómo funciona", "pasos", "proceso", "explicar"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
      label: "Añadir sección Cómo funciona",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("how-it-works", "explanation", "Cómo funciona", 50, {
          title: "De idea a construcción visible",
          steps: [
            "Describe tu idea o pega una URL.",
            "Sistema Maestro interpreta intención, sector y objetivo.",
            "El Builder crea preview, código y estructura sincronizados.",
          ],
        }),
      ],
      components: [
        component("how-it-works-section", "HowItWorksSection", "src/components/sections/HowItWorksSection.jsx"),
      ],
      folders: [folder("src/components/sections", "Secciones reutilizables.")],
      files: [
        file({
          path: "src/components/sections/HowItWorksSection.jsx",
          type: "component",
          description: "Sección explicativa de funcionamiento.",
          content:
            "export function HowItWorksSection(){ return <section><h2>De idea a construcción visible</h2><ol><li>Describe tu idea.</li><li>El sistema interpreta.</li><li>El Builder construye.</li></ol></section>; }",
        }),
      ],
      previewModel: { activeSectionId: "how-it-works" },
      codeModel: { entryFile: "src/components/sections/HowItWorksSection.jsx" },
      structureModel: {
        folders: ["src/components/sections"],
        files: ["src/components/sections/HowItWorksSection.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Añadir explicación reutilizable."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    label: "Añadir bloque de confianza",
    description: "Añade prueba, autoridad y seguridad para mejorar conversión.",
    matchers: ["confianza", "reseñas", "resenas", "testimonios", "autoridad", "garantia", "garantía", "seguridad"],
    creditTier: CREDIT_TIERS.LOW,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
      label: "Añadir bloque de confianza",
      source,
      creditTier: CREDIT_TIERS.LOW,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("trust-section", "trust", "Confianza", 60, {
          title: "Construcción asistida con criterio experto",
          points: ["Proceso visible", "Código coherente", "Estructura exportable"],
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
          description: "Sección de confianza.",
          content:
            "export function TrustSection(){ return <section><h2>Construcción asistida con criterio experto</h2><ul><li>Proceso visible</li><li>Código coherente</li><li>Estructura exportable</li></ul></section>; }",
        }),
      ],
      previewModel: { activeSectionId: "trust-section" },
      codeModel: { entryFile: "src/components/sections/TrustSection.jsx" },
      structureModel: {
        folders: ["src/components/sections"],
        files: ["src/components/sections/TrustSection.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.LOW, "Añadir bloque de confianza."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
        BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE,
    label: "Crear base de restaurante",
    description: "Crea hero, carta, reservas y ubicación para restaurante.",
    matchers: ["restaurante", "bar", "cafeteria", "cafetería", "menu", "menú", "carta"],
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
          title: "Reserva tu mesa hoy",
          subtitle: "Una experiencia gastronómica cuidada, cercana y fácil de reservar.",
          buttonLabel: "Reservar mesa",
        }),
        block("restaurant-menu", "menu", "Carta destacada", 20, {
          title: "Carta destacada",
          items: ["Entrantes", "Platos principales", "Postres", "Bebidas"],
        }),
        block("restaurant-location", "location", "Ubicación", 40, {
          title: "Estamos cerca de ti",
          subtitle: "Consulta ubicación y horario antes de reservar.",
        }),
      ],
      components: [
        component("restaurant-landing", "RestaurantLanding", "src/pages/RestaurantLanding.jsx", "page"),
      ],
      folders: [
        folder("src/pages", "Páginas principales."),
        folder("src/components/restaurant", "Componentes de restaurante."),
      ],
      files: [
        file({
          path: "src/pages/RestaurantLanding.jsx",
          type: "page",
          description: "Landing inicial de restaurante.",
          content:
            "export function RestaurantLanding(){ return <main><h1>Reserva tu mesa hoy</h1><button>Reservar mesa</button></main>; }",
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
    label: "Añadir flujo de reservas",
    description: "Añade estructura de reservas, CTA y componente inicial.",
    matchers: ["reserva", "reservas", "citas", "agenda", "booking"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW,
      label: "Añadir flujo de reservas",
      source,
      objective: "booking",
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("booking-flow", "booking", "Reservas", 35, {
          title: "Reserva en menos de un minuto",
          fields: ["nombre", "fecha", "hora", "personas"],
          buttonLabel: "Confirmar reserva",
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
          description: "Formulario inicial de reservas.",
          content:
            "export function BookingForm(){ return <form><input placeholder='Nombre'/><input placeholder='Fecha'/><button>Confirmar reserva</button></form>; }",
        }),
      ],
      ctas: [cta("cta-confirm-booking", "Confirmar reserva", "/", "booking")],
      previewModel: { activeSectionId: "booking-flow" },
      codeModel: { entryFile: "src/components/booking/BookingForm.jsx" },
      structureModel: {
        folders: ["src/components/booking"],
        files: ["src/components/booking/BookingForm.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Añadir reservas visibles."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
    label: "Añadir formulario de leads",
    description: "Añade formulario de captación para servicios, agencias o negocios locales.",
    matchers: ["leads", "contacto", "formulario", "captar", "clientes", "presupuesto"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_LEADS_FORM,
      label: "Añadir formulario de leads",
      source,
      objective: "lead_generation",
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("lead-form", "lead_form", "Formulario de contacto", 45, {
          title: "Cuéntanos qué necesitas",
          fields: ["nombre", "email", "mensaje"],
          buttonLabel: "Solicitar información",
        }),
      ],
      components: [
        component("lead-form", "LeadForm", "src/components/conversion/LeadForm.jsx"),
      ],
      folders: [folder("src/components/conversion", "Componentes de conversión.")],
      files: [
        file({
          path: "src/components/conversion/LeadForm.jsx",
          type: "component",
          description: "Formulario de captación de leads.",
          content:
            "export function LeadForm(){ return <form><input placeholder='Nombre'/><input placeholder='Email'/><textarea placeholder='Mensaje'/><button>Solicitar información</button></form>; }",
        }),
      ],
      previewModel: { activeSectionId: "lead-form" },
      codeModel: { entryFile: "src/components/conversion/LeadForm.jsx" },
      structureModel: {
        folders: ["src/components/conversion"],
        files: ["src/components/conversion/LeadForm.jsx"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Añadir formulario de captación."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_DASHBOARD]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
    label: "Añadir dashboard",
    description: "Añade estructura inicial de dashboard para app o SaaS.",
    matchers: ["dashboard", "panel", "admin", "area privada", "área privada"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
      label: "Añadir dashboard",
      source,
      projectKind: "app",
      creditTier: CREDIT_TIERS.HIGH,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("dashboard-preview", "dashboard", "Dashboard", 80, {
          title: "Panel principal",
          widgets: ["Actividad", "Proyectos", "Créditos", "Próximas acciones"],
        }),
      ],
      components: [
        component("dashboard-page", "DashboardPage", "src/pages/DashboardPage.jsx", "page"),
      ],
      folders: [
        folder("src/pages", "Páginas principales."),
        folder("src/components/dashboard", "Componentes del dashboard."),
      ],
      files: [
        file({
          path: "src/pages/DashboardPage.jsx",
          type: "page",
          description: "Página inicial de dashboard.",
          content:
            "export function DashboardPage(){ return <main><h1>Panel principal</h1><section>Actividad · Proyectos · Créditos</section></main>; }",
        }),
      ],
      routes: [route("/dashboard", "Dashboard", "DashboardPage")],
      previewModel: {
        layout: "app_dashboard",
        activeSectionId: "dashboard-preview",
      },
      codeModel: { entryFile: "src/pages/DashboardPage.jsx" },
      structureModel: {
        folders: ["src/pages", "src/components/dashboard"],
        files: ["src/pages/DashboardPage.jsx"],
        routes: ["/dashboard"],
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "Añadir dashboard inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
    label: "Añadir flujo de autenticación",
    description: "Añade estructura de login, registro y callback.",
    matchers: ["auth", "autenticacion", "autenticación", "login", "registro", "register"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
      label: "Añadir flujo de autenticación",
      source,
      creditTier: CREDIT_TIERS.HIGH,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      folders: [
        folder("src/features/auth", "Módulo de autenticación."),
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
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "Añadir autenticación inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_GOOGLE_ACCESS,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.ADD_API_LAYER]: defineMutation({
    type: BUILDER_MUTATION_TYPES.ADD_API_LAYER,
    label: "Añadir capa API",
    description: "Prepara rutas API y estructura backend inicial.",
    matchers: ["api", "backend", "endpoint", "fastapi", "servidor", "base de datos"],
    creditTier: CREDIT_TIERS.HIGH,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      label: "Añadir capa API",
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
          path: "backend/app/routers/projects.py",
          type: "api_route",
          language: "python",
          description: "Router inicial de proyectos.",
          content:
            "from fastapi import APIRouter\n\nrouter = APIRouter(prefix='/projects', tags=['projects'])\n\n@router.get('/')\ndef list_projects():\n    return []\n",
        }),
      ],
      apiRoutes: [route("/api/projects", "Projects API", "projects_router")],
      structureModel: {
        folders: ["backend/app/routers", "backend/app/services", "backend/app/schemas"],
        files: ["backend/app/routers/projects.py"],
        apiRoutes: ["/api/projects"],
      },
      codeModel: {
        framework: "fastapi",
        language: "python",
        entryFile: "backend/app/routers/projects.py",
      },
      creditEstimate: creditEstimate(CREDIT_TIERS.HIGH, "Añadir API inicial."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
        BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE]: defineMutation({
    type: BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    label: "Generar estructura de carpetas",
    description: "Genera estructura frontend/backend coherente.",
    matchers: ["estructura", "carpetas", "archivos", "arquitectura", "frontend", "backend"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      label: "Generar estructura de carpetas",
      source,
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.STRUCTURE_READY,
      folders: [
        folder("src", "Fuente frontend."),
        folder("src/components", "Componentes reutilizables."),
        folder("src/pages", "Páginas."),
        folder("src/features", "Módulos funcionales."),
        folder("backend/app", "Aplicación backend."),
        folder("backend/app/routers", "Rutas API."),
        folder("backend/app/services", "Servicios backend."),
      ],
      files: [
        file({
          path: "src/App.jsx",
          type: "entry",
          description: "Entrada frontend.",
          content: "export default function App(){ return <main>Proyecto generado</main>; }",
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
        folders: ["src", "src/components", "src/pages", "src/features", "backend/app", "backend/app/routers", "backend/app/services"],
        files: ["src/App.jsx", "backend/app/main.py"],
      },
      codeModel: { entryFile: "src/App.jsx" },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Generar estructura base."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
        BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
        BUILDER_MUTATION_TYPES.ADD_API_LAYER,
      ]),
    }),
  }),

  [BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN]: defineMutation({
    type: BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
    label: "Preparar plan de exportación",
    description: "Prepara salida profesional sin ejecutar exportación todavía.",
    matchers: ["exportar", "sacar", "descargar", "zip", "github", "transferir"],
    creditTier: CREDIT_TIERS.PREMIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.PREPARE_EXPORT_PLAN,
      label: "Preparar plan de exportación",
      source,
      creditTier: CREDIT_TIERS.PREMIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("export-plan", "export", "Plan de exportación", 90, {
          title: "Salida profesional del proyecto",
          checklist: ["Estructura coherente", "Código representativo", "Valoración", "Entrega"],
        }),
      ],
      folders: [folder("export", "Preparación conceptual de salida.")],
      files: [
        file({
          path: "export/README.md",
          type: "documentation",
          language: "markdown",
          description: "Plan inicial de exportación.",
          content: "# Exportación\n\nPendiente de valoración, empaquetado y entrega profesional.\n",
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
    label: "Mejorar conversión premium",
    description: "Refuerza propuesta de valor, CTA y narrativa de conversión.",
    matchers: ["premium", "conversion", "conversión", "vender", "cta", "mejorar landing", "más potente", "mas potente"],
    creditTier: CREDIT_TIERS.MEDIUM,
    build: ({ source = "user" } = {}) => ({
      type: BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      label: "Mejorar conversión premium",
      source,
      creditTier: CREDIT_TIERS.MEDIUM,
      nextStatus: BUILD_STATUS.AWAITING_USER_DECISION,
      blocks: [
        block("premium-conversion", "conversion", "Conversión premium", 25, {
          title: "Construye más rápido con una base guiada",
          subtitle: "Sistema Maestro convierte tu idea en estructura, preview y siguientes decisiones.",
          buttonLabel: "Crear mi proyecto",
        }),
      ],
      ctas: [cta("cta-create-project", "Crear mi proyecto", "/", "primary_conversion")],
      previewModel: { activeSectionId: "premium-conversion" },
      creditEstimate: creditEstimate(CREDIT_TIERS.MEDIUM, "Mejorar conversión principal."),
      availableActions: nextActions([
        BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
        BUILDER_MUTATION_TYPES.ADD_SUBSCRIPTION_BOX,
        BUILDER_MUTATION_TYPES.ADD_GEMA_MAESTRA_SECTION,
      ]),
    }),
  }),
};

const intentMutationMap = {
  [BUILDER_ITERATION_INTENT_IDS.PREMIUMIZE]: [BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION],
  [BUILDER_ITERATION_INTENT_IDS.CLARIFY]: [BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS],
  [BUILDER_ITERATION_INTENT_IDS.INCREASE_CONVERSION]: [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
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
  [BUILDER_PROJECT_TYPES.LOCAL_RESERVATION_PAGE]: [BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE],
  [BUILDER_PROJECT_TYPES.SAAS_LANDING]: [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
  ],
  [BUILDER_PROJECT_TYPES.AI_TOOL]: [
    BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
  ],
  [BUILDER_PROJECT_TYPES.AUTOMATION_WORKFLOW]: [
    BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
    BUILDER_MUTATION_TYPES.ADD_API_LAYER,
  ],
};

const goalMutationMap = {
  [BUILDER_PRIMARY_GOALS.BOOK_RESERVATION]: [BUILDER_MUTATION_TYPES.ADD_BOOKING_FLOW],
  [BUILDER_PRIMARY_GOALS.CAPTURE_LEADS]: [BUILDER_MUTATION_TYPES.ADD_LEADS_FORM],
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
  const directMatches = getAllBuilderMutations()
    .filter((definition) => includesAny(input, definition.matchers))
    .map((definition) => definition.type);

  if (directMatches.length) {
    return Array.from(new Set(directMatches));
  }

  if (includesAny(input, ["restaurante", "bar", "cafeteria", "cafetería"])) {
    return [BUILDER_MUTATION_TYPES.ADD_RESTAURANT_BASE];
  }

  if (includesAny(input, ["app", "saas", "dashboard", "aplicacion", "aplicación"])) {
    return [
      BUILDER_MUTATION_TYPES.GENERATE_FOLDER_STRUCTURE,
      BUILDER_MUTATION_TYPES.ADD_DASHBOARD,
      BUILDER_MUTATION_TYPES.ADD_AUTH_FLOW,
    ];
  }

  if (includesAny(input, ["landing", "web", "pagina", "página"])) {
    return [
      BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
      BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
      BUILDER_MUTATION_TYPES.ADD_TRUST_SECTION,
    ];
  }

  return [
    BUILDER_MUTATION_TYPES.IMPROVE_PREMIUM_CONVERSION,
    BUILDER_MUTATION_TYPES.ADD_HOW_IT_WORKS,
  ];
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

  return Array.from(new Set(types.filter(Boolean)));
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