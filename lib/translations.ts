export type Language = 'de' | 'en' | 'es';

export interface Translations {
  // Steps & Navigation
  stepLabel: (current: number, total: number) => string
  next: string
  back: string
  showResults: string
  showAnalysis: string

  // Currency
  currency: string
  currencyEur: string
  currencyUsd: string
  currencyGbp: string

  // Headers & Titles
  title: string;
  subtitle: string;
  potential: string;
  
  // Landing Page (Step 0)
  landingTitle: string;
  landingSubtitle: string;
  landingDescription1: string;
  landingDescription2: string;
  landingCta: string;
  landingFooter: string;
  
  // Form Labels
  machineModel: string;
  productType: string;
  productState: string;
  monthlyProduction: string;
  materialPrice: string;
  currentYield: string;
  targetYield: string;
  
  // Contact
  contactHeader: string
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  companyLabel: string;
  countryLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  companyPlaceholder: string;
  countryPlaceholder: string;

  // Product Types
  fish: string;
  pork: string;
  beef: string;
  poultry: string;
  vegan: string;
  
  // Product States
  fresh: string;
  frozen: string;
  
  // Machine Models
  hpi300: string;
  hpi350: string;
  hpi650: string;
  
  // Recommendation
  recommendationTitle: string
  recommendationCta: string
  recommendationDesc: (machine: string) => string
  machineLinks: {
    hpi300: string
    hpi350: string
    hpi650: string
  }

  // Results
  additionalProfitPerYear: string;
  monthly: string;
  moreProduct: string;
  paybackTime: string;
  lessThanOneMonth: string;
  years: string;
  
  // Buttons
  saveAnalysis: string;
  submit: string;
  cancel: string;
  
  // Modal
  modalTitle: string;
  modalDescription: string;
  
  // Disclaimer
  disclaimer: string;
  
  // Units
  kg: string;
  euro: string;
}

export const translations: Record<Language, Translations> = {
  de: {
    stepLabel: (current, total) => `Schritt ${current} von ${total}`,
    next: "Weiter",
    back: "Zurück",
    showResults: "Ergebnis anzeigen",
    showAnalysis: "Analyse anzeigen",
    currency: "Währung",
    currencyEur: "EUR (€)",
    currencyUsd: "USD ($)",
    currencyGbp: "GBP (£)",
    title: 'ROI-Rechner',
    subtitle: 'Berechnen Sie Ihr Einsparpotenzial',
    potential: 'Ihr Potenzial',
    landingTitle: 'MAKU ROI-Rechner',
    landingSubtitle: 'Berechnen Sie Ihre Amortisation in wenigen Schritten.',
    landingDescription1: 'Ermitteln Sie präzise, wie schnell sich eine MAKU Hochleistungs-Injektion für Ihr Unternehmen rechnet.',
    landingDescription2: 'Optimierte Ausbeute und höchste Produktqualität garantieren messbare Rentabilität.',
    landingCta: 'Berechnung starten',
    landingFooter: 'Made in Germany – Präzision trifft Innovation',
    machineModel: 'Maschinen-Modell',
    productType: 'Produkt / Rohware',
    productState: 'Zustand',
    monthlyProduction: 'Monatliche Produktion (kg)',
    materialPrice: 'Rohmaterialpreis (€/kg)',
    currentYield: 'Aktueller Ertrag / Yield (%)',
    targetYield: 'Ziel-Ertrag mit neuer Technologie (%)',
    contactHeader: 'Kontaktdaten',
    nameLabel: 'Name',
    emailLabel: 'E-Mail',
    phoneLabel: 'Telefon',
    companyLabel: 'Unternehmen',
    countryLabel: 'Land',
    namePlaceholder: 'Ihr Name',
    emailPlaceholder: 'ihre.email@beispiel.de',
    phonePlaceholder: '+49 123 456789',
    companyPlaceholder: 'Ihr Unternehmen',
    countryPlaceholder: 'Ihr Land',
    fish: 'Fisch',
    pork: 'Schwein',
    beef: 'Rind',
    poultry: 'Geflügel',
    vegan: 'Vegan/Andere',
    fresh: 'Frisch',
    frozen: 'Gefroren',
    hpi300: 'HPI 300 / Standard',
    hpi350: 'HPI 350',
    hpi650: 'HPI 650',
    recommendationTitle: 'Unsere Empfehlung',
    recommendationCta: 'Mehr zum Modell',
    recommendationDesc: (machine) => `Basierend auf Ihrer Produktionsmenge empfehlen wir das Modell ${machine}.`,
    machineLinks: {
      hpi300: "https://maku-meattec.com/hpi-300-2/",
      hpi350: "https://maku-meattec.com/hpi-300/",
      hpi650: "https://maku-meattec.com/hpi-650/",
    },
    additionalProfitPerYear: 'Zusätzlicher Gewinn pro Jahr',
    monthly: 'monatlich',
    moreProduct: 'Mehr Produkt (kg)',
    paybackTime: 'Payback Zeit',
    lessThanOneMonth: '< 1 Monat',
    years: 'Jahre',
    saveAnalysis: 'Jetzt Analyse sichern',
    submit: 'Absenden',
    cancel: 'Abbrechen',
    modalTitle: 'Analyse sichern',
    modalDescription: 'Geben Sie Ihre Kontaktdaten ein, um Ihre persönliche ROI-Analyse zu erhalten.',
    disclaimer: '* Personal-, Energie- und Wasserkosteneinsparungen sind hier noch nicht enthalten.',
    kg: 'kg',
    euro: '€',
  },
  en: {
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    next: "Next",
    back: "Back",
    showResults: "Show results",
    showAnalysis: "Show analysis",
    currency: "Currency",
    currencyEur: "EUR (€)",
    currencyUsd: "USD ($)",
    currencyGbp: "GBP (£)",
    title: 'ROI Calculator',
    subtitle: 'Calculate your savings potential',
    potential: 'Your Potential',
    landingTitle: 'MAKU ROI Calculator',
    landingSubtitle: 'Calculate your amortization in just a few steps.',
    landingDescription1: 'Determine precisely how quickly a MAKU high-performance injection pays off for your business.',
    landingDescription2: 'Optimized yield and highest product quality guarantee measurable profitability.',
    landingCta: 'Start calculation',
    landingFooter: 'Made in Germany – Precision meets Innovation',
    machineModel: 'Machine Model',
    productType: 'Product / Raw Material',
    productState: 'Condition',
    monthlyProduction: 'Monthly Production (kg)',
    materialPrice: 'Raw Material Price (€/kg)',
    currentYield: 'Current Yield (%)',
    targetYield: 'Target Yield with New Technology (%)',
    contactHeader: 'Contact Details',
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    companyLabel: 'Company',
    countryLabel: 'Country',
    namePlaceholder: 'Your Name',
    emailPlaceholder: 'your.email@example.com',
    phonePlaceholder: '+1 234 567890',
    companyPlaceholder: 'Your Company',
    countryPlaceholder: 'Your Country',
    fish: 'Fish',
    pork: 'Pork',
    beef: 'Beef',
    poultry: 'Poultry',
    vegan: 'Vegan/Other',
    fresh: 'Fresh',
    frozen: 'Frozen',
    hpi300: 'HPI 300 / Standard',
    hpi350: 'HPI 350',
    hpi650: 'HPI 650',
    recommendationTitle: 'Our Recommendation',
    recommendationCta: 'Learn more',
    recommendationDesc: (machine) => `Based on your production volume, we recommend the ${machine} model.`,
    machineLinks: {
      hpi300: "https://maku-meattec.com/hpi-300-2/",
      hpi350: "https://maku-meattec.com/hpi-300/",
      hpi650: "https://maku-meattec.com/hpi-650/",
    },
    additionalProfitPerYear: 'Additional Profit per Year',
    monthly: 'monthly',
    moreProduct: 'More Product (kg)',
    paybackTime: 'Payback Time',
    lessThanOneMonth: '< 1 Month',
    years: 'years',
    saveAnalysis: 'Save Analysis Now',
    submit: 'Submit',
    cancel: 'Cancel',
    modalTitle: 'Save Analysis',
    modalDescription: 'Enter your contact details to receive your personal ROI analysis.',
    disclaimer: '* Personnel, energy, and water cost savings are not yet included here.',
    kg: 'kg',
    euro: '€',
  },
  es: {
    stepLabel: (current, total) => `Paso ${current} de ${total}`,
    next: "Siguiente",
    back: "Atrás",
    showResults: "Ver resultado",
    showAnalysis: "Mostrar análisis",
    currency: "Moneda",
    currencyEur: "EUR (€)",
    currencyUsd: "USD ($)",
    currencyGbp: "GBP (£)",
    title: 'Calculadora ROI',
    subtitle: 'Calcule su potencial de ahorro',
    potential: 'Su Potencial',
    landingTitle: 'Calculadora ROI MAKU',
    landingSubtitle: 'Calcule su amortización en pocos pasos.',
    landingDescription1: 'Determine con precisión cuán rápido una inyección de alto rendimiento MAKU se amortiza para su empresa.',
    landingDescription2: 'Rendimiento optimizado y la más alta calidad de producto garantizan rentabilidad medible.',
    landingCta: 'Iniciar cálculo',
    landingFooter: 'Hecho en Alemania – Precisión encuentra Innovación',
    machineModel: 'Modelo de Máquina',
    productType: 'Producto / Materia Prima',
    productState: 'Estado',
    monthlyProduction: 'Producción Mensual (kg)',
    materialPrice: 'Precio de Materia Prima (€/kg)',
    currentYield: 'Rendimiento Actual (%)',
    targetYield: 'Rendimiento Objetivo con Nueva Tecnología (%)',
    contactHeader: 'Datos de contacto',
    nameLabel: 'Nombre',
    emailLabel: 'Correo Electrónico',
    phoneLabel: 'Teléfono',
    companyLabel: 'Empresa',
    countryLabel: 'País',
    namePlaceholder: 'Su Nombre',
    emailPlaceholder: 'su.correo@ejemplo.com',
    phonePlaceholder: '+34 123 456789',
    companyPlaceholder: 'Su Empresa',
    countryPlaceholder: 'Su País',
    fish: 'Pescado',
    pork: 'Cerdo',
    beef: 'Carne de Vaca',
    poultry: 'Aves de Corral',
    vegan: 'Vegano/Otro',
    fresh: 'Fresco',
    frozen: 'Congelado',
    hpi300: 'HPI 300 / Estándar',
    hpi350: 'HPI 350',
    hpi650: 'HPI 650',
    recommendationTitle: 'Nuestra recomendación',
    recommendationCta: 'Más sobre el modelo',
    recommendationDesc: (machine) => `Según su volumen de producción, recomendamos el modelo ${machine}.`,
    machineLinks: {
      hpi300: "https://maku-meattec.com/hpi-300-2/",
      hpi350: "https://maku-meattec.com/hpi-300/",
      hpi650: "https://maku-meattec.com/hpi-650/",
    },
    additionalProfitPerYear: 'Ganancia Adicional por Año',
    monthly: 'mensual',
    moreProduct: 'Más Producto (kg)',
    paybackTime: 'Tiempo de Recuperación',
    lessThanOneMonth: '< 1 Mes',
    years: 'años',
    saveAnalysis: 'Guardar Análisis Ahora',
    submit: 'Enviar',
    cancel: 'Cancelar',
    modalTitle: 'Guardar Análisis',
    modalDescription: 'Ingrese sus datos de contacto para recibir su análisis ROI personalizado.',
    disclaimer: '* Los ahorros en costos de personal, energía y agua aún no están incluidos aquí.',
    kg: 'kg',
    euro: '€',
  },
};

export function getTranslation(language: Language): Translations {
  return translations[language];
}
