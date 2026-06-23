"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PALETA = [
  "#2563eb","#7c3aed","#db2777","#dc2626","#ea580c",
  "#d97706","#16a34a","#0891b2","#0f172a","#64748b",
];

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

function hexParaHsl(hex: string): string {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}

function hslParaHex(hsl: string): string {
  const parts = hsl.match(/\d+\.?\d*/g);
  if (!parts || parts.length < 3) return "#000000";
  const h = Number(parts[0])/360, s = Number(parts[1])/100, l = Number(parts[2])/100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if(t<0) t+=1; if(t>1) t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  let r,g,b;
  if(s===0){r=g=b=l}else{
    const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return `#${[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("")}`;
}

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [hslInput, setHslInput] = useState(() =>
    /^#[0-9a-f]{6}$/i.test(value) ? hexParaHsl(value) : ""
  );
  const [modoHsl, setModoHsl] = useState(false);

  function handleHslChange(raw: string) {
    setHslInput(raw);
    try {
      const hex = hslParaHex(raw);
      if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex);
    } catch { /* mantém o valor anterior */ }
  }

  function handleNativo(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setHslInput(hexParaHsl(e.target.value));
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>}

      {/* Paleta rápida */}
      <div className="flex flex-wrap gap-1.5">
        {PALETA.map((cor) => (
          <button
            key={cor}
            type="button"
            title={cor}
            onClick={() => { onChange(cor); setHslInput(hexParaHsl(cor)); }}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
              value === cor ? "border-slate-900 dark:border-white scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: cor }}
          />
        ))}
        {/* Seletor nativo de cor */}
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-brand-blue" title="Cor personalizada">
          <input type="color" value={value || "#2563eb"} onChange={handleNativo}
            className="absolute -inset-1 h-8 w-8 cursor-pointer opacity-0" />
          <svg className="h-full w-full text-slate-400" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      {/* Toggle HSL manual */}
      <button
        type="button"
        onClick={() => setModoHsl((v) => !v)}
        className="flex items-center gap-1 self-start text-xs text-slate-400 hover:text-brand-blue"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {modoHsl ? "Fechar HSL" : "Inserir HSL manualmente"}
      </button>

      {modoHsl && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={hslInput}
            onChange={(e) => handleHslChange(e.target.value)}
            placeholder="220 90% 56%"
            className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700" style={{ backgroundColor: value }} />
        </div>
      )}
    </div>
  );
}
