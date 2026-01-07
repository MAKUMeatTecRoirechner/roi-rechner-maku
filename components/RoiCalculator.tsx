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
import { Language, getTranslation } from "@/lib/translations";
import { cn } from "@/lib/utils";

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
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const springValue = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(springValue, (latest) => Math.round(latest).toLocaleString("de-DE"));

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

export function RoiCalculator() {
  const [language, setLanguage] = React.useState<Language>("de");
  const [currency, setCurrency] = React.useState<Currency>("EUR");
  const t = getTranslation(language);

  // Wizard state - 5 steps (no contact step, using modal instead)
  const totalSteps = 5;
  const [currentStep, setCurrentStep] = React.useState<number>(1);

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
  const [nameError, setNameError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
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

  // Validation per step - all fields must be filled
  const isStepValid = (step: number) => {
    switch (step) {
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
        setIsModalOpen(true);
        return; // Verhindere das Wechseln zu Step 5
      }
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1 && !isModalOpen) {
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

  const handleModalSubmit = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    
    if (!isNameValid || !isEmailValid) {
      return;
    }

    const data = {
      name,
      email,
      phone,
      language,
      currency,
      productType: productTypeKey,
      productState: productStateKey,
      monthlyProduction: parseFloat(monthlyProduction),
      materialPrice: parseFloat(materialPrice),
      currentYield: parseFloat(currentYield),
      targetYield: parseFloat(targetYield),
      machineSuggestion,
      results: calculateResults,
    };

    // Send to make.com webhook
    try {
      const response = await fetch('https://hook.us2.make.com/2tgypw8klty3xleg5pmi0i5nhghs35oo', {
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
        setNameError("");
        setEmailError("");
        
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
                        {formatCurrency(calculateResults.profitPerYear)}
                      </p>
                      <p className="text-sm text-gray-300 mt-3">
                        {t.monthly}: <span className="font-bold text-white">{formatCurrency(calculateResults.profitPerMonth)}</span>
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
                        {formatPaybackTime(calculateResults.paybackTime)}
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
    <div className="relative w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen" role="main" aria-label="ROI Calculator Application">
      {/* Tech Industrial Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-white to-gray-100" aria-hidden="true">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(#2B2B2B 1px, transparent 1px), linear-gradient(90deg, #2B2B2B 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Kompakter Header - Logo & Titel horizontal */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4">
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
      </motion.div>

      {/* Language Switcher - Mobile */}
      <div className="mb-6 sm:hidden flex justify-end">
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </div>

      {/* Hero Section */}
      <HeroSection 
        title={stepTitle()}
        stepNumber={currentStep}
        totalSteps={totalSteps}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
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

            {/* Enhanced Navigation - Hidden on Step 5 */}
            {currentStep < 5 && (
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
      </motion.div>

      {/* Contact Modal with Enhanced Design */}
      <Dialog 
        open={isModalOpen} 
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
          className="sm:max-w-lg border-2 border-[#C41230]"
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
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-black bg-gradient-to-r from-[#1A1A1A] to-[#C41230] bg-clip-text text-transparent">
              {t.modalTitle}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 font-medium">
              {t.modalDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
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
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <label className="text-sm font-bold leading-none text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                {t.phoneLabel} <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="h-14 text-base border-2 focus:ring-2 focus:ring-[#C41230] hover:border-[#C41230] transition-all duration-300"
              />
            </motion.div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-4">
            {/* Cancel-Button entfernt - Modal kann nicht geschlossen werden ohne Datenübermittlung */}
            <motion.div 
              whileHover={!name || !email || !!nameError || !!emailError ? {} : { scale: 1.05 }} 
              whileTap={!name || !email || !!nameError || !!emailError ? {} : { scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                onClick={handleModalSubmit}
                disabled={!name || !email || !!nameError || !!emailError}
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
