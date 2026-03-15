"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { buildLoopSections } from "@/data/build-loop";

export default function BuildLoopPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % buildLoopSections.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, []);

  const activeSection = buildLoopSections[activeIndex];

  return (
    <main className="min-h-screen overflow-hidden bg-[#d6ff35] text-black">
      <div className="relative min-h-screen border border-black/12 p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_22%),linear-gradient(135deg,rgba(0,0,0,0.03),transparent_38%)]" />

        <div className="relative z-10 flex min-h-[calc(100vh-3rem)] flex-col justify-between">
          <header className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-black/56">
                Slice Mobile / Build Loop
              </p>
              <h1 className="mt-5 font-display text-[4.5rem] uppercase leading-[0.88] tracking-[-0.06em] md:text-[7rem] lg:text-[8.5rem]">
                Keep building.
              </h1>
              <p className="mt-4 max-w-3xl text-2xl leading-[1.08] text-black/78 md:text-3xl">
                Use the time well. Tight scope, clear story, better judgment.
              </p>
            </div>
            <div className="rounded-full border-2 border-black bg-black px-5 py-3">
              <Image
                src="/branding/slice-logo.svg"
                alt="Slice"
                width={96}
                height={30}
                className="h-5 w-auto brightness-0 invert"
              />
            </div>
          </header>

          <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <AnimatePresence mode="wait">
              <motion.section
                key={activeSection.title}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -28 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[2rem] border-2 border-black bg-black px-7 py-7 text-[#d6ff35] shadow-[16px_16px_0_rgba(0,0,0,0.12)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d6ff35]/56">
                  {activeSection.label}
                </p>
                <h2 className="mt-6 font-display text-5xl uppercase leading-[0.9] tracking-[-0.05em] md:text-7xl">
                  {activeSection.title}
                </h2>
                <p className="mt-6 max-w-3xl text-2xl leading-[1.1] text-[#d6ff35]/82 md:text-3xl">
                  {activeSection.body}
                </p>
              </motion.section>
            </AnimatePresence>

            <div className="grid gap-4">
              {buildLoopSections.map((section, index) => {
                const active = index === activeIndex;

                return (
                  <div
                    key={section.title}
                    className={`rounded-[1.6rem] border-2 px-5 py-5 transition ${
                      active
                        ? "border-black bg-black text-[#d6ff35] shadow-[10px_10px_0_rgba(0,0,0,0.12)]"
                        : "border-black/20 bg-white/35 text-black"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-56">
                          {section.label}
                        </p>
                        <p className="mt-3 font-display text-2xl uppercase leading-[0.95] tracking-[-0.04em] md:text-3xl">
                          {section.title}
                        </p>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-56">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="mt-8 flex items-center justify-between gap-6 text-xs font-semibold uppercase tracking-[0.24em] text-black/56">
            <span>Looping build tips and tool prompts</span>
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(buildLoopSections.length).padStart(2, "0")}</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
