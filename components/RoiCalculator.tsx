"use client";

import * as React from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend, Cell, AreaChart, Area, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, DollarSign, Clock, Package, Zap, CheckCircle2, 
  Settings, Factory, Target, ArrowRight, Sparkles
} from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Language, getTranslation, COUNTRIES } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

type Currency = "EUR" | "USD" | "GBP";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, type: "spring" as const, bounce: 0.4 }
  }
};

const slideIn = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

// Animated Counter Component
function AnimatedCounter({
  value,
  duration = 1.5,
  format,
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
}) {
  const springValue = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(springValue, (latest) => {
    if (format) return format(latest);
    return Math.round(latest).toLocaleString("de-DE");
  });

  React.useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{display}</motion.span>;
}

// Currency conversion rates (EUR base)
const CURRENCY_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 0.86, // 1 EUR = 0.86 USD
  GBP: 0.87, // 1 EUR = 0.87 GBP
};

// Machine prices in euros (using internal keys)
const MACHINE_PRICES: Record<string, number> = {
  hpi300: 60000,
  hpi350: 110000,
  hpi650: 210000,
};

interface CalculationResults {
  outputOld: number;
  outputNew: number;
  outputDiff: number;
  profitPerYear: number;
  profitPerMonth: number;
  paybackTime: number;
}

const formatCurrencyIntl = (value: number, currency: Currency) => {
  const locale = currency === "USD" ? "en-US" : currency === "GBP" ? "en-GB" : "de-DE";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumberIntl = (value: number) =>
  new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getMachineSuggestion = (monthlyProduction: number) => {
  if (monthlyProduction <= 7000) return "hpi300";
  if (monthlyProduction <= 14000) return "hpi350";
  return "hpi650";
};

export function RoiCalculator({ embed = false }: { embed?: boolean }) {
  const [language, setLanguage] = React.useState<Language>("de");
  const [currency, setCurrency] = React.useState<Currency>("EUR");
  const t = getTranslation(language);
  const privacyPolicyUrl = "https://maku-meattec.com/datenschutzerklaerung-dsgvo/";
  const makeWebhookUrl =
    process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL ??
    "https://hook.eu1.make.com/udrguaupu3ryq82aeh7lsf994htdzdim";

  // Wizard state - 5 calculator steps (Step 0 = Landing wird nicht mitgezählt)
  const totalSteps = 5;
  // In embed mode we skip the big landing step by default (better UX in iframes)
  const [currentStep, setCurrentStep] = React.useState<number>(embed ? 1 : 0);

  // Data states - with default values (user can edit)
  const [productTypeKey, setProductTypeKey] = React.useState<string>("");
  const [productStateKey, setProductStateKey] = React.useState<string>("");
  const [monthlyProduction, setMonthlyProduction] = React.useState<string>("15000");
  const [materialPrice, setMaterialPrice] = React.useState<string>("5.5");
  const [currentYield, setCurrentYield] = React.useState<string>("98");
  const [targetYield, setTargetYield] = React.useState<string>("120");
  
  // Contact modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [phoneError, setPhoneError] = React.useState("");
  const [privacyConsent, setPrivacyConsent] = React.useState(false);
  const [privacyConsentError, setPrivacyConsentError] = React.useState("");
  const [dataSubmitted, setDataSubmitted] = React.useState(false);

  // Machine suggestion is derived later
  const machineSuggestion = React.useMemo(() => {
    const monthlyVal = parseFloat(monthlyProduction);
    if (isNaN(monthlyVal) || monthlyVal <= 0) return "hpi300";
    return getMachineSuggestion(monthlyVal);
  }, [monthlyProduction]);

  // Derived labels
  const productType =
    productTypeKey === "fish"
      ? t.fish
      : productTypeKey === "pork"
      ? t.pork
      : productTypeKey === "beef"
      ? t.beef
      : productTypeKey === "poultry"
      ? t.poultry
      : productTypeKey === "vegan"
      ? t.vegan
      : "";

  const productState = productStateKey === "fresh" ? t.fresh : productStateKey === "frozen" ? t.frozen : "";

  const suggestedMachineLabel =
    machineSuggestion === "hpi300"
      ? t.hpi300
      : machineSuggestion === "hpi350"
      ? t.hpi350
      : t.hpi650;

  // Convert EUR to selected currency
  const convertCurrency = (valueInEUR: number): number => {
    return valueInEUR * CURRENCY_RATES[currency];
  };

  // Calculations
  const calculateResults = React.useMemo((): CalculationResults | null => {
    const monthlyVal = parseFloat(monthlyProduction);
    const price = parseFloat(materialPrice);
    const yieldOld = parseFloat(currentYield);
    const yieldNew = parseFloat(targetYield);
    const costEUR = MACHINE_PRICES[machineSuggestion];

    if (
      isNaN(monthlyVal) ||
      isNaN(price) ||
      isNaN(yieldOld) ||
      isNaN(yieldNew) ||
      !costEUR ||
      monthlyVal <= 0 ||
      price <= 0 ||
      yieldOld < 0 ||
      yieldNew < 0 ||
      yieldNew <= yieldOld
    ) {
      return null;
    }

    const outputOld = monthlyVal * (1 + yieldOld / 100);
    const outputNew = monthlyVal * (1 + yieldNew / 100);
    const outputDiff = outputNew - outputOld;
    const profitPerYearEUR = outputDiff * price * 12;
    const profitPerMonthEUR = profitPerYearEUR / 12;
    
    // Convert to selected currency
    const profitPerYear = convertCurrency(profitPerYearEUR);
    const profitPerMonth = convertCurrency(profitPerMonthEUR);
    const cost = convertCurrency(costEUR);
    
    const paybackTime = cost / profitPerYear;

    return {
      outputOld,
      outputNew,
      outputDiff,
      profitPerYear,
      profitPerMonth,
      paybackTime,
    };
  }, [monthlyProduction, materialPrice, currentYield, targetYield, machineSuggestion, currency]);

  const formatPaybackTime = (years: number): string => {
    if (years < 0.08) {
      return t.lessThanOneMonth;
    }
    return `${years.toFixed(1).replace(".", ",")} ${t.years}`;
  };

  const formatCurrency = (value: number): string => formatCurrencyIntl(value, currency);
  const formatNumber = (value: number): string => formatNumberIntl(value);

  // Validation functions
  const validateName = (value: string): boolean => {
    if (/\d/.test(value)) {
      setNameError(language === "de" ? "Name darf keine Zahlen enthalten" : language === "en" ? "Name cannot contain numbers" : "El nombre no puede contener números");
      return false;
    }
    if (value.trim().length < 2) {
      setNameError(language === "de" ? "Name muss mindestens 2 Zeichen lang sein" : language === "en" ? "Name must be at least 2 characters" : "El nombre debe tener al menos 2 caracteres");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError(language === "de" ? "Bitte geben Sie eine gültige E-Mail-Adresse ein" : language === "en" ? "Please enter a valid email address" : "Por favor ingrese una dirección de correo electrónico válida");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePhone = (value: string): boolean => {
    // Strikte Validierung mit libphonenumber-js
    const trimmedValue = value.trim();
    
    // Mindestlänge prüfen
    if (trimmedValue.length < 8) {
      setPhoneError(language === "de" 
        ? "Telefonnummer muss mindestens 8 Zeichen haben" 
        : language === "en" 
        ? "Phone number must be at least 8 characters" 
        : "El número de teléfono debe tener al menos 8 caracteres");
      return false;
    }

    // Nur Ziffern extrahieren für Fake-Pattern-Check
    const digitsOnly = trimmedValue.replace(/\D/g, '');
    
    // Blockiere offensichtliche Fake-Patterns
    if (digitsOnly.length > 0) {
      const allSameDigit = /^(\d)\1+$/.test(digitsOnly); // z.B. 000000, 111111
      const sequential = digitsOnly === '123456789' || digitsOnly === '987654321' || 
                         digitsOnly === '12345678' || digitsOnly === '123456' ||
                         digitsOnly === '1234567890';
      
      if (allSameDigit || sequential) {
        setPhoneError(language === "de" 
          ? "Bitte geben Sie eine gültige Telefonnummer ein" 
          : language === "en" 
          ? "Please enter a valid phone number" 
          : "Por favor ingrese un número de teléfono válido");
        return false;
      }
    }

    // libphonenumber-js Validierung mit ausgewähltem Land als Default
    try {
      const defaultCountry = (country || 'DE') as CountryCode;
      
      // Prüfe ob Nummer für das ausgewählte Land gültig ist
      const isValid = isValidPhoneNumber(trimmedValue, defaultCountry);
      
      if (!isValid) {
        setPhoneError(language === "de" 
          ? "Ungültige Telefonnummer. Bitte inkl. Ländervorwahl (z.B. +49) oder nationale Vorwahl (z.B. 0176) eingeben" 
          : language === "en" 
          ? "Invalid phone number. Please include country code (e.g. +49) or national prefix (e.g. 0176)" 
          : "Número de teléfono inválido. Por favor incluya código de país (ej. +34) o prefijo nacional");
        return false;
      }
      
      setPhoneError("");
      return true;
    } catch (error) {
      setPhoneError(language === "de" 
        ? "Ungültige Telefonnummer" 
        : language === "en" 
        ? "Invalid phone number" 
        : "Número de teléfono inválido");
      return false;
    }
  };

  // Validation per step - all fields must be filled
  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return true; // Landing page is always valid
      case 1:
        return !!currency;
      case 2:
        return !!productTypeKey && !!productStateKey;
      case 3:
        const monthlyVal = parseFloat(monthlyProduction);
        const priceVal = parseFloat(materialPrice);
        return !!monthlyProduction && !!materialPrice && !isNaN(monthlyVal) && !isNaN(priceVal) && monthlyVal > 0 && priceVal > 0;
      case 4:
        const yieldOld = parseFloat(currentYield);
        const yieldNew = parseFloat(targetYield);
        return (
          !!currentYield &&
          !!targetYield &&
          !isNaN(yieldOld) &&
          !isNaN(yieldNew) &&
          yieldOld >= 0 &&
          yieldNew > yieldOld
        );
      case 5:
        return calculateResults !== null;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      if (currentStep === 4) {
        // Step 4 -> Step 5 (Results), open modal for contact
        // Gehe NICHT zu Step 5, sondern öffne nur das Modal
        setPrivacyConsent(false);
        setPrivacyConsentError("");
        setIsModalOpen(true);
        return; // Verhindere das Wechseln zu Step 5
      }
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0 && !isModalOpen) {
      // Wenn man von Step 5 zurückgeht, setze das dataSubmitted Flag zurück
      if (currentStep === 5) {
        setDataSubmitted(false);
      }
      setCurrentStep((s) => s - 1);
    }
  };

  // Chart data for Output comparison (Alt vs Neu)
  const chartData = React.useMemo(() => {
    if (!calculateResults) return null;
    const maxValue = Math.max(calculateResults.outputNew, calculateResults.outputOld);
    const oldWidth = Math.max((calculateResults.outputOld / maxValue) * 100, 5);
    const newWidth = Math.max((calculateResults.outputNew / maxValue) * 100, 5);
    return { oldWidth, newWidth, oldValue: calculateResults.outputOld, newValue: calculateResults.outputNew };
  }, [calculateResults]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (value) validateName(value);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) validateEmail(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value) validatePhone(value);
  };

  const handleModalSubmit = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    
    if (!isNameValid || !isEmailValid || !isPhoneValid) {
      return;
    }

    if (!privacyConsent) {
      setPrivacyConsentError(
        language === "de"
          ? "Bitte bestätigen Sie die Datenschutzerklärung."
          : language === "en"
          ? "Please confirm the privacy policy."
          : "Por favor confirme la política de privacidad."
      );
      return;
    }

    // Ländername statt ISO-Code senden für GoHighLevel-Kompatibilität
    const countryName = COUNTRIES.find((c) => c.code === country)?.name || country;
    
    // Telefonnummer in E.164 Format normalisieren
    let normalizedPhone = phone;
    try {
      const defaultCountry = (country || 'DE') as CountryCode;
      const phoneNumber = parsePhoneNumber(phone, defaultCountry);
      if (phoneNumber) {
        normalizedPhone = phoneNumber.format('E.164'); // z.B. +491761234567
      }
    } catch (error) {
      // Fallback auf eingegebene Nummer, wenn Parsing fehlschlägt
      normalizedPhone = phone;
    }
    
    // Ergebnisse runden wie auf der Ergebnisseite angezeigt
    const roundedResults = calculateResults ? {
      outputOld: Math.round(calculateResults.outputOld),
      outputNew: Math.round(calculateResults.outputNew),
      outputDiff: Math.round(calculateResults.outputDiff),
      profitPerYear: Math.round(calculateResults.profitPerYear),
      profitPerMonth: Math.round(calculateResults.profitPerMonth),
      paybackTime: Number(calculateResults.paybackTime.toFixed(1)),
    } : null;
    
    const data = {
      name,
      email,
      phone: normalizedPhone,
      company,
      country: countryName,
      language,
      currency,
      productType: productTypeKey,
      productState: productStateKey,
      // Alle Zahlen runden um genaue Maschinenpreis-Rückrechnung zu verhindern
      monthlyProduction: Math.round(parseFloat(monthlyProduction)),
      materialPrice: Number(parseFloat(materialPrice).toFixed(2)),
      currentYield: Number(parseFloat(currentYield).toFixed(1)),
      targetYield: Number(parseFloat(targetYield).toFixed(1)),
      machineSuggestion,
      results: roundedResults,
    };

    // Send to make.com webhook
    try {
      const response = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // Success: Markiere Daten als übermittelt und gehe zu Step 5
        setDataSubmitted(true);
        setIsModalOpen(false);
        setCurrentStep(5); // Gehe zu Step 5 (Ergebnisse)
        setName("");
        setEmail("");
        setPhone("");
        setCompany("");
        setCountry("");
        setNameError("");
        setEmailError("");
        setPhoneError("");
        setPrivacyConsent(false);
        setPrivacyConsentError("");
        
        // Success message
        alert(
          language === "de" 
            ? "Vielen Dank! Ihre Daten wurden erfolgreich übermittelt." 
            : language === "en" 
            ? "Thank you! Your data has been submitted successfully." 
            : "¡Gracias! Sus datos han sido enviados correctamente."
        );
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error("Error sending data to webhook:", error);
      alert(
        language === "de" 
          ? "Fehler beim Senden der Daten. Bitte versuchen Sie es erneut." 
          : language === "en" 
          ? "Error sending data. Please try again." 
          : "Error al enviar los datos. Por favor, inténtelo de nuevo."
      );
    }
  };

  const stepTitle = () => {
    switch (currentStep) {
      case 0:
        return ""; // No title for landing page
      case 1:
        return t.currency;
      case 2:
        return `${t.productType} & ${t.productState}`;
      case 3:
        return `${t.monthlyProduction} / ${t.materialPrice}`;
      case 4:
        return `${t.currentYield} & ${t.targetYield}`;
      case 5:
        return t.potential;
      default:
        return t.potential;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        // Landing Page (Step 0)
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              embed
                ? "w-full"
                : "min-h-[70vh] flex items-center justify-center"
            }
          >
            <div className="w-full max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                
                {/* Left Column - Hero Image + Language Switcher */}
                <motion.div
                  variants={scaleIn}
                  className="space-y-6"
                >
                  <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200">
                    <Image
                      src="/Images/start seite roi rechner/startseite roi rechner.jpg"
                      alt="MAKU Hochleistungs-Injektion"
                      fill
                      className="object-cover"
                      priority
                      quality={90}
                    />
                  </div>
                  
                  {/* Sprachauswahl unter dem Bild */}
                  <div className="flex justify-center">
                    <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
                  </div>
                </motion.div>

                {/* Right Column - Content */}
                <motion.div
                  variants={slideIn}
                  className="space-y-8"
                >
                  {/* Heading */}
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-none tracking-tight">
                      {t.landingTitle}
                    </h1>
                    <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
                      {t.landingSubtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="text-base sm:text-lg text-gray-600 leading-relaxed space-y-3">
                    <p>
                      {t.landingDescription1}
                    </p>
                    <p>
                      {t.landingDescription2}
                    </p>
                  </div>

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setCurrentStep(1)}
                      className="h-16 px-12 text-lg font-bold shadow-2xl hover:shadow-2xl transition-all group"
                      style={{
                        backgroundColor: '#C41230',
                        color: '#FFFFFF'
                      }}
                    >
                      <span className="flex items-center gap-3">
                        {t.landingCta}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </span>
                    </Button>
                  </motion.div>

                  {/* Subtle Feature Hint */}
                  <p className="text-sm text-gray-500 italic">
                    {t.landingFooter}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.currency}</label>
              </div>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger className="w-full h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300">
                  <SelectValue placeholder={language === "de" ? "Währung wählen" : language === "en" ? "Select currency" : "Seleccionar moneda"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">{t.currencyEur}</SelectItem>
                  <SelectItem value="USD">{t.currencyUsd}</SelectItem>
                  <SelectItem value="GBP">{t.currencyGbp}</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Product Type Selection with Images */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.productType}</label>
              </div>
              
              {/* Visual Product Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { key: 'fish', label: t.fish, image: 'fischlogo.webp' },
                  { key: 'pork', label: t.pork, image: 'schweinlogo.webp' },
                  { key: 'beef', label: t.beef, image: 'rindlogo.webp' },
                  { key: 'poultry', label: t.poultry, image: 'huhnlogo.webp' }
                ].map((product) => (
                  <motion.button
                    key={product.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setProductTypeKey(product.key)}
                    aria-label={`${product.label} auswählen`}
                    aria-pressed={productTypeKey === product.key}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 transition-all duration-300 group overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#C41230]/50",
                      productTypeKey === product.key
                        ? "border-[#C41230] bg-[#C41230]/10 shadow-xl"
                        : "border-gray-300 hover:border-[#C41230] bg-white"
                    )}
                  >
                    {/* Background Glow */}
                    {productTypeKey === product.key && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gradient-to-br from-[#C41230]/20 to-transparent"
                      />
                    )}
                    
                    {/* Product Image */}
                    <div className="relative z-10 space-y-3">
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50">
                        <Image
                          src={`/Images/products/${product.image}`}
                          alt={product.label}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <p className={cn(
                        "text-sm font-bold text-center transition-colors",
                        productTypeKey === product.key ? "text-[#C41230]" : "text-gray-700"
                      )}>
                        {product.label}
                      </p>
                    </div>
                    
                    {/* Selected Checkmark */}
                    {productTypeKey === product.key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-[#C41230] flex items-center justify-center shadow-lg"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Product State Selection */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.productState}</label>
              </div>
              <Select value={productStateKey} onValueChange={setProductStateKey}>
                <SelectTrigger className="w-full h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300">
                  <SelectValue placeholder={language === "de" ? "Zustand wählen" : language === "en" ? "Select condition" : "Seleccionar estado"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresh">{t.fresh}</SelectItem>
                  <SelectItem value="frozen">{t.frozen}</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.monthlyProduction}</label>
              </div>
              <Input
                type="number"
                value={monthlyProduction}
                onChange={(e) => setMonthlyProduction(e.target.value)}
                placeholder="100000"
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                inputMode="numeric"
                required
              />
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">
                  {t.materialPrice.replace("€", currency === "EUR" ? "€" : currency === "USD" ? "$" : "£")}
                </label>
              </div>
              <Input
                type="number"
                step="0.01"
                value={materialPrice}
                onChange={(e) => setMaterialPrice(e.target.value)}
                placeholder="1.50"
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                inputMode="decimal"
                required
              />
            </motion.div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.currentYield}</label>
              </div>
              <Input
                type="number"
                step="0.1"
                value={currentYield}
                onChange={(e) => setCurrentYield(e.target.value)}
                placeholder="98.0"
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                inputMode="decimal"
                required
              />
            </motion.div>
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C41230]" />
                <label className="text-base font-semibold text-foreground block">{t.targetYield}</label>
              </div>
              <Input
                type="number"
                step="0.1"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value)}
                placeholder="99.5"
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                inputMode="decimal"
                required
              />
            </motion.div>
          </motion.div>
        );
      case 5:
        // Zeige Ergebnisse nur an, wenn Daten erfolgreich übermittelt wurden
        if (!dataSubmitted) {
          return (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-4">
                  {language === "de" 
                    ? "Bitte geben Sie Ihre Kontaktdaten ein, um die Ergebnisse zu sehen." 
                    : language === "en" 
                    ? "Please enter your contact details to see the results." 
                    : "Por favor ingrese sus datos de contacto para ver los resultados."}
                </p>
              </div>
            </motion.div>
          );
        }
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {calculateResults ? (
              <>
                {/* Kompaktes Ergebnis-Layout */}
                <motion.div 
                  variants={scaleIn}
                  className="space-y-6"
                >
                  {/* Main Profit Display */}
                  <div className="relative text-center py-8 bg-gradient-to-br from-[#1A1A1A] via-[#2B2B2B] to-[#1A1A1A] rounded-2xl border-2 border-[#C41230] shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(#C41230 1px, transparent 1px), linear-gradient(90deg, #C41230 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                      }} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-[#C41230]" />
                        <p className="text-xs font-bold text-white uppercase tracking-widest">{t.additionalProfitPerYear}</p>
                        <Sparkles className="w-5 h-5 text-[#C41230]" />
                      </div>
                      <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#C41230] drop-shadow-lg">
                        <AnimatedCounter
                          value={calculateResults.profitPerYear}
                          format={(v) => formatCurrencyIntl(Math.round(v), currency)}
                        />
                      </p>
                      <p className="text-sm text-gray-300 mt-3">
                        {t.monthly}:{" "}
                        <span className="font-bold text-white">
                          <AnimatedCounter
                            value={calculateResults.profitPerMonth}
                            format={(v) => formatCurrencyIntl(Math.round(v), currency)}
                          />
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Kompakte KPIs direkt darunter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(196, 18, 48, 0.15)" }}
                    className="relative rounded-2xl border-2 border-gray-200 p-8 shadow-lg bg-gradient-to-br from-white to-gray-50 overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C41230] opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-[#C41230]" />
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">{t.moreProduct}</p>
                      </div>
                      <p className="text-4xl font-black text-[#1A1A1A]">
                        <AnimatedCounter value={calculateResults.outputDiff} /> {t.kg}
                      </p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(196, 18, 48, 0.15)" }}
                    className="relative rounded-2xl border-2 border-[#C41230] p-8 shadow-lg bg-gradient-to-br from-[#C41230] to-[#a00f26] overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-white" />
                        <p className="text-xs text-white font-bold uppercase tracking-widest">{t.paybackTime}</p>
                      </div>
                      <p className="text-4xl font-black text-white drop-shadow-lg">
                        {calculateResults.paybackTime < 0.08 ? (
                          t.lessThanOneMonth
                        ) : (
                          <AnimatedCounter
                            value={calculateResults.paybackTime}
                            format={(v) => `${v.toFixed(1).replace(".", ",")} ${t.years}`}
                          />
                        )}
                      </p>
                    </div>
                  </motion.div>
                  </div>
                </motion.div>

                {/* Recommendation Card with Machine Image */}
                <motion.div 
                  variants={scaleIn}
                  className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#C41230]"
                >
                  {/* Machine Background Image */}
                  <div className="relative w-full h-96 sm:h-[28rem]">
                    <Image
                      src={`/Images/Maschiens(hpi injektors/${
                        machineSuggestion === 'hpi300' ? 'hpi300.jpg.webp' :
                        machineSuggestion === 'hpi350' ? 'hpi350.jpg.png' :
                        'hpi650.jpg.webp'
                      }`}
                      alt={suggestedMachineLabel}
                      fill
                      className="object-cover"
                      quality={90}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/90 to-[#1A1A1A]/30" />
                    
                    {/* Animated Grid Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #C41230 0, #C41230 2px, transparent 2px, transparent 20px)',
                      }} />
                    </div>
                  </div>
                  
                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Settings className="w-7 h-7 text-[#C41230]" />
                          <p className="text-sm uppercase tracking-widest font-black text-[#C41230]">
                            {t.recommendationTitle}
                          </p>
                        </div>
                        
                        <h3 className="text-4xl sm:text-5xl font-black text-white">
                          {suggestedMachineLabel}
                        </h3>
                        
                        <p className="text-base sm:text-lg leading-relaxed text-gray-300 max-w-2xl">
                          {t.recommendationDesc(suggestedMachineLabel)}
                        </p>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <Button
                          className="h-16 px-12 font-bold text-lg shadow-2xl group"
                          style={{ 
                            backgroundColor: '#C41230',
                            color: '#FFFFFF'
                          }}
                          asChild
                        >
                          <a href={t.machineLinks[machineSuggestion]} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                            <Factory className="w-6 h-6" />
                            {t.recommendationCta}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                          </a>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground leading-relaxed text-center">{t.disclaimer}</p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">
                {language === "de" && "Bitte Eingaben prüfen, um das Ergebnis zu sehen."}
                {language === "en" && "Please check your inputs to see the result."}
                {language === "es" && "Revise sus datos para ver el resultado."}
              </div>
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn("relative w-full", !embed && "min-h-screen")}
      role="main"
      aria-label="ROI Calculator Application"
    >
      {/* Tech Industrial Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-white to-gray-100" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#2B2B2B 1px, transparent 1px), linear-gradient(90deg, #2B2B2B 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Header - Nur anzeigen wenn nicht auf Landing (Step 0) */}
      {currentStep > 0 && (
        <>
          {/* Kompakter Header - Logo & Titel horizontal */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-0"
          >
            <div className="flex items-center justify-between gap-4 mb-6">
              {/* Logo + Titel horizontal */}
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex-shrink-0 relative w-24 h-12 sm:w-32 sm:h-16"
                >
                  <Image
                    src="/Images/maku-logo.png/maku-logo.png.png"
                    alt="MAKU Meat Tec Logo"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A]">
                  ROI-Rechner
                </h1>
              </div>

              {/* Language Switcher - Desktop */}
              <LanguageSwitcher language={language} onLanguageChange={setLanguage} className="hidden sm:flex" />
            </div>

            {/* Language Switcher - Mobile */}
            <div className="mb-6 sm:hidden flex justify-end">
              <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
            </div>
          </motion.div>

          {/* Hero Section */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <HeroSection 
              title={stepTitle()}
              stepNumber={currentStep} // currentStep 1-5 entspricht Schritt 1-5
              totalSteps={totalSteps}   // totalSteps = 5
            />
          </div>
        </>
      )}


      {/* Content Area */}
      <div
        className={
          currentStep === 0
            ? embed
              ? "px-4 sm:px-6 lg:px-8 py-6"
              : "px-4 sm:px-6 lg:px-8 py-16"
            : "max-w-5xl mx-auto p-4 sm:p-6 lg:p-8"
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {currentStep === 0 ? (
            // Landing Page - No Card wrapper
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          ) : (
            // Calculator Steps - Card wrapper
            <Card className="overflow-hidden shadow-2xl border-2 border-gray-300 bg-white backdrop-blur-sm">
              <CardContent className="space-y-8 pt-10 px-6 sm:px-10 pb-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>

                {/* Enhanced Navigation - Hidden on Step 0 and Step 5 */}
                {currentStep > 0 && currentStep < 5 && (
                  <motion.div 
                    className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t-2 border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          className="h-14 px-6 font-bold border-2 hover:bg-gray-100 disabled:opacity-40 text-base"
                          onClick={goBack}
                          disabled={currentStep === 1 || isModalOpen}
                          style={{ 
                            borderColor: (currentStep === 1 || isModalOpen) ? '#9CA3AF' : '#2B2B2B',
                            color: (currentStep === 1 || isModalOpen) ? '#9CA3AF' : '#1A1A1A'
                          }}
                        >
                          {t.back}
                        </Button>
                      </motion.div>
                      <motion.div 
                        whileHover={isStepValid(currentStep) ? { scale: 1.05 } : {}} 
                        whileTap={isStepValid(currentStep) ? { scale: 0.95 } : {}}
                      >
                        <Button
                          className="h-14 px-10 font-bold shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base group"
                          onClick={goNext}
                          disabled={!isStepValid(currentStep)}
                          style={{ 
                            backgroundColor: isStepValid(currentStep) ? '#C41230' : '#9CA3AF',
                            color: '#FFFFFF'
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {t.next}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Button>
                      </motion.div>
                    </>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Contact Modal with Enhanced Design */}
      <Dialog 
        open={isModalOpen} 
        // In iframe/embed contexts (e.g. Word), Radix' scroll-lock can break touch scrolling.
        // Non-modal keeps UX smooth while we still prevent closing via the handlers below.
        modal={!embed}
        onOpenChange={(open) => {
          // Verhindere das Schließen des Modals, außer wenn die Daten erfolgreich übermittelt wurden
          // Das Modal kann nur geschlossen werden, wenn isModalOpen bereits false ist (nach erfolgreicher Übermittlung)
          if (!open && isModalOpen) {
            // Verhindere das Schließen - tue nichts
            return;
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-lg border-2 border-[#C41230] !bg-white"
          showCloseButton={false}
          onEscapeKeyDown={(e) => {
            // Verhindere ESC-Taste
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            // Verhindere Klicken außerhalb
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // Verhindere alle Interaktionen außerhalb
            e.preventDefault();
          }}
        >
          <DialogHeader className="space-y-3 flex-shrink-0">
            <DialogTitle className="text-3xl font-black bg-gradient-to-r from-[#1A1A1A] to-[#C41230] bg-clip-text text-transparent">
              {t.modalTitle}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 font-medium">
              {t.modalDescription}
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollbarer Container für Formularfelder */}
          <div className="space-y-6 py-6 overflow-y-auto overscroll-auto flex-1 min-h-0 pr-2 touch-pan-y [-webkit-overflow-scrolling:touch] scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C41230]" />
                {t.nameLabel}
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t.namePlaceholder}
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                onBlur={() => name && validateName(name)}
              />
              {nameError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-[#C41230] font-bold"
                >
                  {nameError}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C41230]" />
                {t.emailLabel}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                onBlur={() => email && validateEmail(email)}
              />
              {emailError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-[#C41230] font-bold"
                >
                  {emailError}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C41230]" />
                {t.phoneLabel}
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
                onBlur={() => phone && validatePhone(phone)}
              />
              {phoneError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-[#C41230] font-bold"
                >
                  {phoneError}
                </motion.p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C41230]" />
                {t.companyLabel}
              </label>
              <Input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={t.companyPlaceholder}
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C41230]" />
                {t.countryLabel}
              </label>
              {/* Natives Select für iframe-Kompatibilität (kein Portal, kein Sprung) */}
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-14 text-base border-2 rounded-md px-3 bg-background text-foreground focus:ring-2 focus:ring-[#C41230] focus:border-[#C41230] hover:border-[#C41230] transition-all duration-300 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 15 5 5 5-5'/%3E%3Cpath d='m7 9 5-5 5 5'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
              >
                <option value="">{t.countryPlaceholder}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* DSGVO / Privacy consent */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[#C41230]"
                  checked={privacyConsent}
                  onChange={(e) => {
                    setPrivacyConsent(e.target.checked);
                    if (e.target.checked) setPrivacyConsentError("");
                  }}
                />
                <span>
                  {language === "de" ? (
                    <>
                      Ich habe die{" "}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#C41230] underline underline-offset-2"
                      >
                        Datenschutzerklärung
                      </a>{" "}
                      gelesen und stimme der Verarbeitung meiner Daten zur Kontaktaufnahme zu.
                    </>
                  ) : language === "en" ? (
                    <>
                      I have read the{" "}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#C41230] underline underline-offset-2"
                      >
                        privacy policy
                      </a>{" "}
                      and agree to the processing of my data for contacting me.
                    </>
                  ) : (
                    <>
                      He leído la{" "}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-[#C41230] underline underline-offset-2"
                      >
                        política de privacidad
                      </a>{" "}
                      y acepto el tratamiento de mis datos para contactarme.
                    </>
                  )}
                </span>
              </label>
              {privacyConsentError && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-[#C41230] font-bold"
                >
                  {privacyConsentError}
                </motion.p>
              )}
            </motion.div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-4 flex-shrink-0 pt-4 border-t border-gray-200">
            {/* Cancel-Button entfernt - Modal kann nicht geschlossen werden ohne Datenübermittlung */}
            <motion.div 
              whileHover={!name || !email || !phone || !company || !country || !privacyConsent || !!nameError || !!emailError || !!phoneError ? {} : { scale: 1.05 }} 
              whileTap={!name || !email || !phone || !company || !country || !privacyConsent || !!nameError || !!emailError || !!phoneError ? {} : { scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={handleModalSubmit}
                disabled={!name || !email || !phone || !company || !country || !privacyConsent || !!nameError || !!emailError || !!phoneError}
                className="w-full h-14 px-10 font-bold shadow-2xl transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: '#C41230',
                  color: '#FFFFFF'
                }}
              >
                {t.submit}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
