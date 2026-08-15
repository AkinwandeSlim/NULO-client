/**
 * Shared light/dark class tokens for Nulo modals.
 * Single source of truth so every dialog uses the same palette and spacing.
 * Use these with `cn(...)` to compose with file-specific overrides.
 */

export const dialogStyles = {
  // Outer card
  card: "w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:shadow-black/40 sm:w-full",
  cardLg: "sm:max-w-2xl",
  cardMd: "sm:max-w-md",
  cardXl: "sm:max-w-3xl",

  // Header band
  header: "relative border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-6 pb-7 pt-7 text-left dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-950",

  // Header content pieces
  title: "text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50",
  description: "mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400",

  // Body
  body: "space-y-5 px-6 py-6",

  // Section card (groups a few fields)
  section: "rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60",
  sectionLabel: "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",

  // Form controls
  label: "text-sm font-medium text-slate-700 dark:text-slate-300",
  labelOptional: "font-normal text-slate-400 dark:text-slate-500",
  input:
    "h-10 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:[color-scheme:dark]",
  inputLg: "h-12 text-base",
  textarea:
    "min-h-24 resize-none border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
  error: "text-xs text-red-600 dark:text-red-400 flex items-center gap-1",

  // Footer / action band
  footer:
    "flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between",

  // Buttons
  primary:
    "w-full bg-orange-600 font-semibold text-white shadow-md shadow-orange-600/20 transition-all duration-200 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/30 dark:bg-orange-500 dark:hover:bg-orange-400 dark:shadow-orange-500/20 sm:w-auto",
  primaryAuto: "sm:w-auto", // helper to drop the w-full on desktop
  secondary:
    "w-full border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-500/30 dark:text-orange-400 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:hover:text-orange-300 sm:w-auto",
  outline:
    "w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:border-slate-600 sm:w-auto",
  danger:
    "w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 sm:w-auto",

  // Info / warning banners
  infoAmber:
    "rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200",
  infoBlue:
    "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/40 dark:text-blue-200",
  infoGreen:
    "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs leading-5 text-green-800 dark:border-green-800/50 dark:bg-green-950/40 dark:text-green-200",
  infoCardAmber:
    "rounded-xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-950/40",
  infoCardBlue:
    "rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/40",
  infoCardGreen:
    "rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-950/40",

  // Section dividers
  divider: "border-slate-200 dark:border-slate-800",
} as const
