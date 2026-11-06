"use client";

import React from "react";
import { PhoScene } from "./pho-scene";
import { BanhMiScene } from "./banh-mi-scene";
import { RiceScene } from "./rice-scene";

export const CulinaryJourney: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-turmeric">Hành trình trải nghiệm</span>
        <h2 className="text-3xl font-bold font-serif text-ink">Ký Ức Ẩm Thực Ba Miền</h2>
      </div>

      <div className="divide-y divide-border/40">
        <PhoScene />
        <BanhMiScene />
        <RiceScene />
      </div>
    </div>
  );
};

