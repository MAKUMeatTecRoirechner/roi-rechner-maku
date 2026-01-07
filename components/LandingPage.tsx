"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Language } from "@/lib/translations";

export function LandingPage() {
  const router = useRouter();
  const [language, setLanguage] = React.useState<Language>("de");

  const handleStartCalculator = () => {
    router.push("/calculator");
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#2B2B2B 1px, transparent 1px), linear-gradient(90deg, #2B2B2B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Header */}
      <div className="relative border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex items-center justify-between">
          <div className="relative w-32 h-16 sm:w-40 sm:h-20">
            <Image
              src="/Images/maku-logo.png/maku-logo.png.png"
              alt="MAKU Meat Tec Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
        </div>
      </div>

      {/* Main Content - Centered 2-Column Layout */}
      <div className="relative flex items-center justify-center min-h-[calc(100vh-100px)] px-6 sm:px-8 lg:px-12 py-16">
        <div className="w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="relative h-[500px] lg:h-[600px]"
            >
              <div className="relative h-full rounded-xl overflow-hidden shadow-2xl border-2 border-gray-200">
                <Image
                  src="/Images/start seite roi rechner/startseite roi rechner.jpg"
                  alt="MAKU Hochleistungs-Injektion"
                  fill
                  className="object-cover"
                  priority
                  quality={90}
                />
              </div>
            </motion.div>

            {/* Right Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-10"
            >
              {/* Heading */}
              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-none tracking-tight"
                >
                  MAKU ROI-Rechner
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl text-gray-600 leading-relaxed"
                >
                  Berechnen Sie Ihre Amortisation in wenigen Schritten.
                </motion.p>
              </div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-600 leading-relaxed space-y-4 max-w-xl"
              >
                <p>
                  Ermitteln Sie präzise, wie schnell sich eine MAKU Hochleistungs-Injektion für Ihr Unternehmen rechnet.
                </p>
                <p>
                  Optimierte Ausbeute und höchste Produktqualität garantieren messbare Rentabilität.
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleStartCalculator}
                  className="h-16 px-12 text-lg font-bold shadow-lg hover:shadow-2xl transition-all group"
                  style={{
                    backgroundColor: '#C41230',
                    color: '#FFFFFF'
                  }}
                >
                  <span className="flex items-center gap-3">
                    Berechnung starten
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.div>

              {/* Subtle Feature Hint */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-sm text-gray-500 italic"
              >
                Made in Germany – Präzision trifft Innovation
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
