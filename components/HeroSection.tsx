"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  title: string;
  stepNumber: number;
  totalSteps: number;
}

export function HeroSection({ title, stepNumber, totalSteps }: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden rounded-3xl mb-8 shadow-2xl"
    >
      {/* Hero Background Image */}
      <Image
        src="/Images/Roi rechner hero section/roi.rechner hero.jpeg"
        alt={`Step ${stepNumber}: ${title}`}
        fill
        className="object-cover"
        priority={stepNumber === 1}
        quality={85}
      />
      
      {/* Gradient Overlay - Dark at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/95 via-[#1A1A1A]/60 to-transparent" />
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#C41230 1px, transparent 1px), linear-gradient(90deg, #C41230 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 z-10">
        <div className="space-y-3">
          {/* Step Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C41230] backdrop-blur-sm"
          >
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              Schritt {stepNumber} von {totalSteps}
            </span>
          </motion.div>
          
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight"
          >
            {title}
          </motion.h2>
        </div>
      </div>
      
      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#C41230] via-[#ff1744] to-[#C41230]" />
    </motion.div>
  );
}
