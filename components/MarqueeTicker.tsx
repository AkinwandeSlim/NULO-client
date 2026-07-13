"use client";

import { motion } from "framer-motion";
import { TickerItem } from "@/data/content";

interface MarqueeTickerProps {
  items: TickerItem[];
  speed?: number;
  theme?: "dark" | "light";
}

export default function MarqueeTicker({ items, speed = 35, theme = "dark" }: MarqueeTickerProps) {
  const repeated = [...items, ...items];

  return (
    <div className="overflow-hidden py-2.5">
      <motion.div
        className="flex items-center gap-6 whitespace-nowrap px-6"
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, ease: "linear", duration: speed }}
      >
        {repeated.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2 text-xs text-orange-400/80">
            <span className="font-semibold text-orange-400">{item.label}</span>
            <span className={`font-semibold ${theme === "dark" ? "text-white/70" : "text-slate-900"}`}>{item.val}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
