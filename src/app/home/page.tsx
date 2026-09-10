"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  fetchHomepage,
  fetchExplanation,
  updatePreferences,
  fetchPreferences,
  readCachedHomepage,
  CardResponse,
  ExplanationResponse,
} from "@/lib/api";
import { Toggle, ToggleGroup } from "@/components/animate-ui/components/base/toggle-group";
import { RippleButton, RippleButtonRipples } from "@/components/animate-ui/components/buttons/ripple";
import { MobileMenuTrigger } from "@/components/AppSidebar";
import PersonaInsightsSection from "@/components/PersonaInsightsSection";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/context/I18nContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { PullToRefresh } from "@/components/PullToRefresh";
import { OfflineBanner } from "@/components/OfflineBanner";
import { FreshnessIndicator, StaleDataBanner, deriveFeedSource } from "@/components/FreshnessIndicator";
import { DataErrorState, NoDataState, LocationFallbackNotice } from "@/components/StateViews";
import { ShareButton, type ForecastShareData } from "@/components/ShareButton";
import { Skeleton, SkeletonCardRow, SkeletonRegion } from "@/components/ui/skeleton";
import {
  translateConditionString,
  formatLocalizedWindDirectionSimple,
  formatLocalizedWmoCondition,
} from "@/lib/i18n/weatherFormatters";
import { formatLocalizedLocation } from "@/lib/i18n/localizeLocation";
import {
  CloudSun,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  LogOut,
  Sparkles,
  HeartPulse,
  Activity,
  Users,
  X,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Wind,
  Sun,
  MapPin,
  Shirt,
  Car,
  Plane,
  Flower2,
  CalendarCheck,
  Compass,
  Waves,
  ArrowRight,
  Sunrise,
  Sunset,
  Eye,
  Umbrella,
  Thermometer,
  Gauge,

  CheckCircle2,
  TrendingUp,
  Clock,
  Navigation,
  Luggage,
CloudRain,
PlaneTakeoff,
Plus,
School,
Sprout,
Droplets,
Snowflake,
CalendarDays,
Leaf,
Tractor,
TrafficCone,
CloudFog,
Route,
PartyPopper,



} from "lucide-react";

export interface PersonaDef {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
}

const PERSONA_THEME = {
  health: {
    canvas:
      "bg-[radial-gradient(circle_at_12%_5%,rgba(167,243,208,0.34),transparent_27%),radial-gradient(circle_at_92%_14%,rgba(165,243,252,0.28),transparent_25%),linear-gradient(180deg,#f2fbf7_0%,#f6f8fb_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_12%_5%,rgba(16,185,129,0.10),transparent_27%),radial-gradient(circle_at_92%_14%,rgba(6,182,212,0.08),transparent_25%),linear-gradient(180deg,#0b1514_0%,#101817_45%,#111827_100%)]",
    hero:
      "bg-gradient-to-br from-white via-emerald-50/95 to-cyan-50/90 text-slate-950 border-white/80 dark:from-emerald-950 dark:via-slate-900 dark:to-cyan-950 dark:text-white dark:border-emerald-900/50",
    glow: "bg-emerald-300/35 dark:bg-emerald-400/10",
    accent: "text-emerald-700 dark:text-emerald-300",
    pill: "bg-emerald-600 text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.65)]",
    border: "border-emerald-200/80 dark:border-emerald-900/60",
  },
  fitness: {
    canvas: "bg-slate-50 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-amber-100 via-orange-50 to-lime-100 text-slate-950 border-amber-200/60 dark:from-amber-950 dark:via-slate-900 dark:to-lime-950 dark:text-white dark:border-amber-900/50",
    glow: "bg-amber-300/30 dark:bg-amber-400/10",
    accent: "text-amber-700 dark:text-amber-300",
    pill: "bg-amber-600 text-white",
    border: "border-amber-200 dark:border-amber-900/60",
  },
  beach: {
    canvas: "bg-sky-50 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-cyan-100 via-sky-50 to-blue-100 text-slate-950 border-cyan-200/60 dark:from-cyan-950 dark:via-slate-900 dark:to-blue-950 dark:text-white dark:border-cyan-900/50",
    glow: "bg-cyan-300/30 dark:bg-cyan-400/10",
    accent: "text-cyan-700 dark:text-cyan-300",
    pill: "bg-cyan-600 text-white",
    border: "border-cyan-200 dark:border-cyan-900/60",
  },
  traveler: {
    canvas: "bg-slate-50 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 text-slate-950 border-indigo-200/60 dark:from-indigo-950 dark:via-slate-900 dark:to-blue-950 dark:text-white dark:border-indigo-900/50",
    glow: "bg-sky-300/30 dark:bg-sky-400/10",
    accent: "text-blue-700 dark:text-blue-300",
    pill: "bg-blue-600 text-white",
    border: "border-blue-200 dark:border-blue-900/60",
  },
  family: {
    canvas: "bg-rose-50/40 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-rose-100 via-amber-50 to-orange-100 text-slate-950 border-rose-200/60 dark:from-rose-950 dark:via-slate-900 dark:to-orange-950 dark:text-white dark:border-rose-900/50",
    glow: "bg-rose-300/30 dark:bg-rose-400/10",
    accent: "text-rose-700 dark:text-rose-300",
    pill: "bg-rose-600 text-white",
    border: "border-rose-200 dark:border-rose-900/60",
  },
  agriculture: {
    canvas: "bg-lime-50/50 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-lime-100 via-emerald-50 to-amber-100 text-slate-950 border-lime-200/60 dark:from-lime-950 dark:via-slate-900 dark:to-amber-950 dark:text-white dark:border-lime-900/50",
    glow: "bg-lime-300/30 dark:bg-lime-400/10",
    accent: "text-lime-700 dark:text-lime-300",
    pill: "bg-lime-700 text-white",
    border: "border-lime-200 dark:border-lime-900/60",
  },
  commuter: {
    canvas: "bg-slate-100 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-slate-100 via-zinc-50 to-amber-100 text-slate-950 border-slate-200/60 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950 dark:text-white dark:border-slate-700",
    glow: "bg-amber-300/25 dark:bg-amber-400/10",
    accent: "text-slate-700 dark:text-slate-300",
    pill: "bg-slate-800 text-white",
    border: "border-slate-200 dark:border-slate-700",
  },
  event: {
    canvas: "bg-violet-50/40 dark:bg-slate-950",
    hero:
      "bg-gradient-to-br from-violet-100 via-purple-50 to-rose-100 text-slate-950 border-violet-200/60 dark:from-violet-950 dark:via-slate-900 dark:to-rose-950 dark:text-white dark:border-violet-900/50",
    glow: "bg-violet-300/30 dark:bg-violet-400/10",
    accent: "text-violet-700 dark:text-violet-300",
    pill: "bg-violet-600 text-white",
    border: "border-violet-200 dark:border-violet-900/60",
  },
} as const;

export const ALL_PERSONAS: PersonaDef[] = [
  {
    id: "health",
    title: "Health-Conscious",
    shortTitle: "Health",
    subtitle: "AQI dial, UV index, pollen & humidity alerts",
    icon: HeartPulse,
    color: "text-emerald-600",
    activeBg: "bg-teal-600 text-white shadow-teal-600/25",
  },
  {
    id: "fitness",
    title: "Runner / Athlete",
    shortTitle: "Runner",
    subtitle: "Optimal running window, pace score & weather notes",
    icon: Activity,
    color: "text-amber-600",
    activeBg: "bg-amber-600 text-white shadow-amber-600/25",
  },
  {
    id: "beach",
    title: "Beachgoer / Surfer",
    shortTitle: "Beach & Surf",
    subtitle: "Tide chart, wave height & swell direction",
    icon: Waves,
    color: "text-cyan-600",
    activeBg: "bg-cyan-600 text-white shadow-cyan-600/25",
  },
  {
    id: "traveler",
    title: "Traveler",
    shortTitle: "Traveler",
    subtitle: "Multi-city cards, flight risk & packing tips",
    icon: Plane,
    color: "text-blue-600",
    activeBg: "bg-blue-600 text-white shadow-blue-600/25",
  },
  {
    id: "family",
    title: "Parent / Family",
    shortTitle: "Family",
    subtitle: "School commute rain alert, fog & storm warning",
    icon: Users,
    color: "text-sky-600",
    activeBg: "bg-sky-600 text-white shadow-sky-600/25",
  },
  {
    id: "agriculture",
    title: "Farmer / Gardener",
    shortTitle: "Gardener",
    subtitle: "Soil moisture, frost alert & rainfall prediction",
    icon: Flower2,
    color: "text-lime-700",
    activeBg: "bg-lime-700 text-white shadow-lime-700/25",
  },
  {
    id: "commuter",
    title: "Commuter",
    shortTitle: "Commuter",
    subtitle: "Visibility index & traffic delay integration",
    icon: Car,
    color: "text-purple-600",
    activeBg: "bg-purple-600 text-white shadow-purple-600/25",
  },
  {
    id: "event",
    title: "Event Planner",
    shortTitle: "Event",
    subtitle: "10-day forecast, rain probability & best timings",
    icon: CalendarCheck,
    color: "text-rose-600",
    activeBg: "bg-rose-600 text-white shadow-rose-600/25",
  },
];

/* ===============================================================
   HEALTH EXPOSURE MATRIX (Replaces redundant HealthSnapshot)
   =============================================================== */
function HealthExposureMatrix({ realTimeWeather, airQuality }: any) {
  const aqi = airQuality?.aqi ?? 45;
  const humidity = realTimeWeather?.numericHumidity ?? 60;
  const uv = airQuality?.uvIndex ?? 2.5;

  const respiratoryRisk =
    aqi > 100 || humidity > 80
      ? { label: "Elevated Risk", status: "Sensitive users may experience symptoms", color: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200/50" }
      : aqi > 50
        ? { label: "Moderate Risk", status: "Mild Sensitivity", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50" }
        : { label: "Low Risk", status: "Clear Airways", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50" };

  const safeSunMins = uv > 8 ? "15 mins" : uv > 5 ? "30 mins" : uv > 2 ? "45 mins" : "Unrestricted";

  return (
    <div className="ios-card overflow-hidden border border-emerald-500/20 shadow-[0_16px_45px_-28px_rgba(16,185,129,0.35)]">
      <div className="px-4 sm:px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HeartPulse className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                Health Exposure Matrix
              </h2>
              <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                Body impact & environmental allergy triggers
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            HEALTH VIEW
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-3.5 pb-4">
  {/* 1. AQI */}
  <div
    className={cn(
      "rounded-[19px] border p-3.5 flex flex-col justify-between",
      respiratoryRisk.color
    )}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold opacity-80">
        Air Quality Index (AQI)
      </span>
      <Wind className="h-4 w-4 opacity-70" />
    </div>

    <div className="mt-2 text-[20px] font-bold tracking-[-0.02em]">
      {aqi} AQI
    </div>

    <p className="mt-1 text-[10.5px] font-medium opacity-90">
      {respiratoryRisk.label}
    </p>
  </div>

  {/* 2. POLLEN COUNT */}
  <div className="rounded-[19px] bg-purple-50 dark:bg-purple-950/25 border border-purple-100 dark:border-purple-900/50 p-3.5 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        Pollen Count
      </span>
      <Flower2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
    </div>

    <div className="mt-2 text-[20px] font-bold text-slate-950 dark:text-white">
      Data unavailable
    </div>

    <p className="mt-1 text-[10.5px] font-medium text-purple-700 dark:text-purple-400">
      Allergen information
    </p>
  </div>

  {/* 3. UV INDEX */}
  <div className="rounded-[19px] bg-sky-50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/50 p-3.5 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        UV Index
      </span>
      <Sun className="h-4 w-4 text-sky-600 dark:text-sky-400" />
    </div>

    <div className="mt-2 text-[20px] font-bold text-slate-950 dark:text-white">
      {uv.toFixed(1)} UVI
    </div>

    <p className="mt-1 text-[10.5px] font-medium text-sky-700 dark:text-sky-400">
      UV exposure level
    </p>
  </div>

  {/* 4. HUMIDITY */}
  <div className="rounded-[19px] bg-teal-50 dark:bg-teal-950/25 border border-teal-100 dark:border-teal-900/50 p-3.5 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
        Humidity Level
      </span>
      <Gauge className="h-4 w-4 text-teal-600 dark:text-teal-400" />
    </div>

    <div className="mt-2 text-[20px] font-bold text-slate-950 dark:text-white">
      {humidity}%
    </div>

    <p className="mt-1 text-[10.5px] font-medium text-teal-700 dark:text-teal-400">
      Humidity conditions
    </p>
  </div>
</div>
      </div>
    
  );
}

/* ===============================================================
   ATHLETIC RUNNER HUD
   =============================================================== */
function RunnerHUDView({ realTimeWeather, airQuality }: any) {
  const temp = realTimeWeather?.numericTemp ?? null;
  const feelsLike = realTimeWeather?.feelsLike ?? null;
  const windSpeed = realTimeWeather?.windSpeed ?? null;
  const windDirection = realTimeWeather?.windDirection ?? null;
  const uv = airQuality?.uvIndex ?? null;
  const rainProbability = realTimeWeather?.dailyPrecipProb ?? null;

  // UI preview values for the hourly performance strip.
  // Replace these with hourly forecast data when that endpoint is connected.
  const hourlyWindows = [
    { time: "5 AM", score: 92, label: "Optimal" },
    { time: "6 AM", score: 95, label: "Peak" },
    { time: "7 AM", score: 88, label: "Good" },
    { time: "8 AM", score: 72, label: "Warm" },
    { time: "9 AM", score: 55, label: "Caution" },
  ];

  const windValue = realTimeWeather?.numericWind ?? 0;
  const windDrag = Math.min(100, Math.max(12, Math.round((windValue / 40) * 100)));

  const uvLabel =
    uv === null ? "UV unavailable" : uv < 3 ? "Low UV" : uv < 6 ? "Moderate UV" : "High UV";

  const heatLabel =
    temp === null ? "Heat data unavailable" : temp >= 32 ? "High heat risk" : temp >= 28 ? "Moderate heat" : "Lower heat risk";

  return (
    <div className="space-y-5">
      {/* ATHLETIC HUD STRIP — intentionally unboxed from the Health layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* BEST RUNNING WINDOW */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-5 text-white shadow-xl">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
                Best Running Hours
              </span>
              <span className="inline-block -skew-x-6 bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950">
                PERFORMANCE
              </span>
            </div>

            <div className="mt-3 text-[28px] font-black tracking-tight sm:text-[30px]">
              6:00 – 7:30 AM
            </div>

            <p className="mt-1 text-[11.5px] font-medium text-amber-200/80">
              {temp === null ? "Weather loading" : `${Math.round(temp)}°C`}
              {windSpeed ? ` · ${windSpeed}` : ""}
              {uv !== null ? ` · UV ${uv.toFixed(1)}` : ""}
            </p>
          </div>
        </div>

        {/* WIND / DRAG */}
        <div className="relative overflow-hidden rounded-[24px] bg-white/75 dark:bg-zinc-900/80 backdrop-blur-md border border-amber-500/20 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.16em]">
              Wind & Headwind
            </span>
            <Wind className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[28px] font-black text-slate-950 dark:text-white">
              {windSpeed ?? "—"}
            </span>
            {windDirection && (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {windDirection.replace(" Direction", "")}
              </span>
            )}
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${windDrag}%` }}
            />
          </div>
        </div>

        {/* SUN / HEAT */}
        <div className="relative overflow-hidden rounded-[24px] bg-white/75 dark:bg-zinc-900/80 backdrop-blur-md border border-orange-500/20 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.16em]">
              Sunrise / Sunset
            </span>
            <Sunrise className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>

          <div className="mt-2 text-[21px] font-black text-slate-950 dark:text-white">
            Sunrise / Sunset
          </div>

          <p className="mt-1 text-[11px] font-medium text-orange-600 dark:text-orange-400">
            {feelsLike !== null ? `Feels like ${feelsLike}°` : "Sun data unavailable"} · {heatLabel}
          </p>
        </div>
      </div>

      {/* HOURLY PERFORMANCE TIMELINE */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Hourly Pace & Stamina Timeline
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Workout comfort score by hour
            </p>
          </div>
          <span className="hidden sm:inline-flex -skew-x-6 bg-slate-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-400">
            RUN HUD
          </span>
        </div>

        <div className="overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-[560px] gap-2.5">
            {hourlyWindows.map((item) => {
              const active = item.score === 95;
              return (
                <div
                  key={item.time}
                  className={cn(
                    "relative w-[104px] shrink-0 overflow-hidden rounded-[20px] border p-3.5 transition-all",
                    active
                      ? "bg-slate-950 text-white border-amber-400 shadow-[0_12px_28px_-14px_rgba(245,158,11,0.8)] ring-1 ring-amber-400/40"
                      : "bg-white/70 dark:bg-zinc-900/70 text-slate-700 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[10px] font-extrabold uppercase", active ? "text-amber-400" : "text-slate-400 dark:text-zinc-500")}>
                      {item.time}
                    </span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </div>

                  <div className={cn("mt-2 text-[26px] font-black tracking-tight", active ? "text-white" : "text-slate-950 dark:text-white")}>
                    {item.score}
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                    <div
                      className={cn("h-full rounded-full", active ? "bg-amber-400" : "bg-amber-500/70")}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>

                  <p className={cn("mt-2 text-[9.5px] font-bold uppercase tracking-wide", active ? "text-amber-300" : "text-amber-700 dark:text-amber-400")}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-amber-400">95 = Peak window</span>
          {rainProbability !== null && (
            <span className="rounded-full bg-white/70 px-2.5 py-1 border border-slate-200 dark:bg-zinc-900/70 dark:border-zinc-800">
              Rain probability {rainProbability}%
            </span>
          )}
          <span className="rounded-full bg-white/70 px-2.5 py-1 border border-slate-200 dark:bg-zinc-900/70 dark:border-zinc-800">
            {uvLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
/* ===============================================================
   BEACH & SURF MODE
   UI-FIRST VERSION
   Marine values are temporary demo values and will be connected
   to marine/tide backend data later.
   =============================================================== */
function BeachSurfTelemetryMatrix({
  realTimeWeather,
  airQuality,
}: any) {
  const windSpeed = realTimeWeather?.windSpeed ?? "14";
  const uv = airQuality?.uvIndex ?? 4.2;

  return (
    <div className="space-y-4">
      {/* COASTAL HERO */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-cyan-950 via-sky-900 to-blue-950 p-5 sm:p-6 text-white shadow-[0_20px_60px_-30px_rgba(6,182,212,0.45)]">
        {/* Decorative wave lines */}
        <div className="pointer-events-none absolute -right-12 -bottom-10 h-40 w-64 rounded-[50%] border border-cyan-400/20 rotate-[-8deg]" />
        <div className="pointer-events-none absolute -right-8 -bottom-4 h-32 w-56 rounded-[50%] border border-cyan-300/10 rotate-[-8deg]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-cyan-400/15 border border-cyan-300/15 text-cyan-300">
                <Waves className="h-5 w-5" strokeWidth={2.2} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
                    BEACH MODE
                  </span>

                  <span className="-skew-x-6 rounded-[5px] bg-cyan-400 px-2 py-0.5 text-[8px] font-black uppercase text-slate-950">
                    COASTAL
                  </span>
                </div>

                <h2 className="mt-1 text-[21px] font-black tracking-[-0.035em]">
                  Coastal & Surf Conditions
                </h2>
              </div>
            </div>
          </div>

          <p className="mt-4 max-w-[320px] text-[11.5px] leading-relaxed text-cyan-100/75">
            Sea and shoreline information for safer, more enjoyable beach
            activities.
          </p>

          {/* Live weather context */}
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[9px] font-semibold text-cyan-200/70">
                WIND
              </span>
              <span className="ml-1.5 text-[10px] font-bold text-white">
                {windSpeed} km/h
              </span>
            </div>

            <div className="rounded-full bg-white/10 border border-white/10 px-3 py-1.5 backdrop-blur-md">
              <span className="text-[9px] font-semibold text-cyan-200/70">
                UV
              </span>
              <span className="ml-1.5 text-[10px] font-bold text-white">
                {Number(uv).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOUR PS-REQUIRED MARINE METRICS */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 1. SEA CONDITIONS */}
        <div className="group relative overflow-hidden rounded-[22px] bg-cyan-50 dark:bg-cyan-950/25 border border-cyan-100 dark:border-cyan-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Sea Conditions
            </span>

            <Waves className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div className="mt-4 text-[24px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
            Good
          </div>

          <p className="mt-1 text-[10.5px] font-medium text-cyan-700 dark:text-cyan-400">
            Calm coastal conditions
          </p>

          <div className="mt-3 flex gap-1">
            <span className="h-1.5 flex-1 rounded-full bg-cyan-500" />
            <span className="h-1.5 flex-1 rounded-full bg-cyan-500" />
            <span className="h-1.5 flex-1 rounded-full bg-cyan-500" />
            <span className="h-1.5 flex-1 rounded-full bg-cyan-200 dark:bg-cyan-900" />
          </div>
        </div>

        {/* 2. TIDE TIMINGS */}
        <div className="group relative overflow-hidden rounded-[22px] bg-sky-50 dark:bg-sky-950/25 border border-sky-100 dark:border-sky-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Tide Timings
            </span>

            <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                LOW
              </span>
              <span className="text-[14px] font-black text-slate-950 dark:text-white">
                08:15 AM
              </span>
            </div>

            <div className="h-px bg-sky-200 dark:bg-sky-900" />

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                HIGH
              </span>
              <span className="text-[14px] font-black text-slate-950 dark:text-white">
                02:40 PM
              </span>
            </div>
          </div>

          <p className="mt-2 text-[10px] font-medium text-sky-700 dark:text-sky-400">
            Expanding beach area
          </p>
        </div>

        {/* 3. WAVE HEIGHT */}
        <div className="group relative overflow-hidden rounded-[22px] bg-blue-50 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Wave Height
            </span>

            <Waves className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-[26px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
              1.2–1.6
            </span>

            <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400">
              m
            </span>
          </div>

          <p className="mt-1 text-[10.5px] font-medium text-blue-700 dark:text-blue-400">
            Moderate swell
          </p>

          <div className="mt-3 flex items-end gap-1 h-5">
            <span className="w-1.5 h-2 rounded-full bg-blue-300 dark:bg-blue-800" />
            <span className="w-1.5 h-3 rounded-full bg-blue-400 dark:bg-blue-700" />
            <span className="w-1.5 h-4 rounded-full bg-blue-500 dark:bg-blue-600" />
            <span className="w-1.5 h-5 rounded-full bg-blue-600 dark:bg-blue-500" />
            <span className="w-1.5 h-3 rounded-full bg-blue-400 dark:bg-blue-700" />
            <span className="w-1.5 h-2 rounded-full bg-blue-300 dark:bg-blue-800" />
          </div>
        </div>

        {/* 4. WATER TEMPERATURE */}
        <div className="group relative overflow-hidden rounded-[22px] bg-teal-50 dark:bg-teal-950/25 border border-teal-100 dark:border-teal-900/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">
              Water Temperature
            </span>

            <Thermometer className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-[27px] font-black tracking-[-0.04em] text-slate-950 dark:text-white">
              27
            </span>

            <span className="text-[13px] font-bold text-teal-600 dark:text-teal-400">
              °C
            </span>
          </div>

          <p className="mt-1 text-[10.5px] font-medium text-teal-700 dark:text-teal-400">
            Comfortable for swimming
          </p>

          <div className="mt-3 h-1.5 w-full rounded-full bg-teal-100 dark:bg-teal-900 overflow-hidden">
            <div className="h-full w-[72%] rounded-full bg-teal-500" />
          </div>
        </div>
      </div>

      {/* BEACH SAFETY STRIP */}
      <div className="rounded-[22px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-cyan-500/15 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">
              Beach Safety
            </p>

            <h3 className="mt-1 text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Check conditions before entering the water
            </h3>
          </div>

          <ShieldCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-[14px] bg-slate-50 dark:bg-zinc-800/70 p-2.5">
            <p className="text-[9px] font-bold text-slate-400">UV INDEX</p>
            <p className="mt-1 text-[14px] font-black text-slate-900 dark:text-white">
              {Number(uv).toFixed(1)}
            </p>
          </div>

          <div className="rounded-[14px] bg-slate-50 dark:bg-zinc-800/70 p-2.5">
            <p className="text-[9px] font-bold text-slate-400">WIND</p>
            <p className="mt-1 text-[14px] font-black text-slate-900 dark:text-white">
              {windSpeed}
            </p>
          </div>

          <div className="rounded-[14px] bg-slate-50 dark:bg-zinc-800/70 p-2.5">
            <p className="text-[9px] font-bold text-slate-400">STATUS</p>
            <p className="mt-1 text-[14px] font-black text-emerald-600 dark:text-emerald-400">
              Good
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ===============================================================
   TRAVELER MODE
   UI-FIRST VERSION
   Uses existing real-time weather data.
   Destination list is currently UI/demo data.
   =============================================================== */

function TravelerDashboard({
  realTimeWeather,
  airQuality,
  currentLocation,
}: {
  realTimeWeather: any;
  airQuality: any;
  currentLocation: string;
}) {
  const [selectedDestination, setSelectedDestination] = useState(currentLocation || "London");

  const temp = realTimeWeather?.numericTemp ?? null;
  const humidity = realTimeWeather?.numericHumidity ?? null;
  const wind = realTimeWeather?.numericWind ?? null;
  const rainProbability = realTimeWeather?.dailyPrecipProb ?? null;

  /*
   * Demo saved destinations for the UI.
   * Replace with saved_locations from preferences later.
   */
  const destinations = [
    {
      name: "London",
      country: "UK",
      temp: "18°",
      condition: "Rain likely",
      icon: CloudRain,
      status: "Rain",
      statusClass: "text-sky-600 bg-sky-500/10",
    },
    {
      name: "Mumbai",
      country: "India",
      temp: "29°",
      condition: "Cloudy",
      icon: CloudSun,
      status: "Stable",
      statusClass: "text-emerald-600 bg-emerald-500/10",
    },
    {
      name: "New Delhi",
      country: "India",
      temp: "31°",
      condition: "Sunny",
      icon: Sun,
      status: "Clear",
      statusClass: "text-amber-600 bg-amber-500/10",
    },
    {
      name: "Pimpri-Chinchwad",
      country: "India",
      temp: "27°",
      condition: "Cloudy",
      icon: CloudSun,
      status: "Stable",
      statusClass: "text-emerald-600 bg-emerald-500/10",
    },
  ];

  /*
   * UI-level travel risk.
   * This is weather impact, NOT an actual airline delay prediction.
   */
  const travelRisk =
    (rainProbability ?? 0) >= 70 || (wind ?? 0) >= 35
      ? {
          level: "Moderate Delay Risk",
          description: "Rain or strong winds may affect travel conditions.",
          icon: AlertTriangle,
          className:
            "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300",
        }
      : (rainProbability ?? 0) >= 40 || (wind ?? 0) >= 25
        ? {
            level: "Watch Travel Conditions",
            description: "Changing weather conditions may affect your journey.",
            icon: Wind,
            className:
              "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300",
          }
        : {
            level: "Low Flight Impact",
            description: "No major weather-related travel concern right now.",
            icon: CheckCircle2,
            className:
              "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300",
          };

  const RiskIcon = travelRisk.icon;

  /*
   * Smart packing logic.
   */
  const packingItems =
    (rainProbability ?? 0) >= 60
      ? [
          {
            icon: Umbrella,
            title: "Compact umbrella",
            subtitle: "Rain expected",
          },
          {
            icon: CloudRain,
            title: "Light raincoat",
            subtitle: "Useful outdoors",
          },
          {
            icon: Shirt,
            title: "Quick-dry clothing",
            subtitle: "For wet conditions",
          },
        ]
      : (temp ?? 25) >= 30
        ? [
            {
              icon: Shirt,
              title: "Breathable cottons",
              subtitle: "Hot conditions",
            },
            {
              icon: Sun,
              title: "Sunscreen",
              subtitle: "Sun protection",
            },
            {
              icon: Umbrella,
              title: "Sun umbrella",
              subtitle: "Extra shade",
            },
          ]
        : (temp ?? 25) <= 12
          ? [
              {
                icon: Shirt,
                title: "Thermal layers",
                subtitle: "Cold conditions",
              },
              {
                icon: CloudSun,
                title: "Warm jacket",
                subtitle: "Stay comfortable",
              },
              {
                icon: Luggage,
                title: "Travel essentials",
                subtitle: "Keep handy",
              },
            ]
          : [
              {
                icon: Shirt,
                title: "Light layers",
                subtitle: "Variable weather",
              },
              {
                icon: Sun,
                title: "Sun protection",
                subtitle: "Useful outdoors",
              },
              {
                icon: Luggage,
                title: "Travel essentials",
                subtitle: "Pack smart",
              },
            ];

  return (
    <div className="space-y-4">

      {/* =========================================================
          SAVED DESTINATIONS
         ========================================================= */}
      <section className="space-y-2.5">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Your Destinations
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
              Quick access to your saved places
            </p>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
          {destinations.map((destination) => {
            const Icon = destination.icon;
            const active = selectedDestination === destination.name;

            return (
              <button
                key={destination.name}
                type="button"
                onClick={() => setSelectedDestination(destination.name)}
                className={cn(
                  "ios-pressable shrink-0 snap-start w-[150px] rounded-[21px] p-3.5 text-left border transition-all",
                  active
                    ? "bg-slate-950 text-white border-slate-950 shadow-lg dark:bg-white dark:text-slate-950 dark:border-white"
                    : "bg-white/80 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-[11px] flex items-center justify-center",
                      active
                        ? "bg-white/10 dark:bg-slate-950/10"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      destination.status === "Rain"
                        ? "bg-sky-500"
                        : destination.status === "Clear"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                  />
                </div>

                <p
                  className={cn(
                    "mt-3 text-[13px] font-extrabold",
                    active
                      ? "text-white dark:text-slate-950"
                      : "text-slate-900 dark:text-white"
                  )}
                >
                  {destination.name}
                </p>

                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    active
                      ? "text-white/60 dark:text-slate-950/60"
                      : "text-slate-500 dark:text-zinc-400"
                  )}
                >
                  {destination.country}
                </p>

                <div className="mt-3 flex items-end justify-between">
                  <span
                    className={cn(
                      "text-[22px] font-black tracking-tight",
                      active
                        ? "text-white dark:text-slate-950"
                        : "text-slate-950 dark:text-white"
                    )}
                  >
                    {destination.temp}
                  </span>

                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[8px] font-bold",
                      active
                        ? "bg-white/10 text-white dark:bg-slate-950/10 dark:text-slate-950"
                        : destination.statusClass
                    )}
                  >
                    {destination.status}
                  </span>
                </div>

                <p
                  className={cn(
                    "mt-1 text-[9.5px]",
                    active
                      ? "text-white/60 dark:text-slate-950/60"
                      : "text-slate-500 dark:text-zinc-400"
                  )}
                >
                  {destination.condition}
                </p>
              </button>
            );
          })}
        </div>
      </section>


      {/* =========================================================
          TRAVEL WEATHER IMPACT
         ========================================================= */}
      <div className="relative overflow-hidden rounded-[25px] bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-950 p-5 text-white shadow-[0_20px_55px_-25px_rgba(37,99,235,0.55)]">

        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-[15px] bg-white/10 border border-white/10 flex items-center justify-center">
                <PlaneTakeoff className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                  Flight & Transit
                </p>
                <h2 className="mt-0.5 text-[17px] font-extrabold">
                  Weather Impact
                </h2>
              </div>
            </div>

            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white/70">
              {selectedDestination}
            </span>
          </div>

          <div className="mt-5 rounded-[19px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-[13px] flex items-center justify-center border",
                  travelRisk.className
                )}
              >
                <RiskIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[17px] font-black">
                  {travelRisk.level}
                </p>

                <p className="mt-0.5 text-[10.5px] leading-relaxed text-white/60">
                  {travelRisk.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-[16px] bg-white/5 border border-white/10 p-3">
              <Wind className="h-3.5 w-3.5 text-blue-300" />
              <p className="mt-2 text-[9px] uppercase tracking-wide text-white/45">
                Wind
              </p>
              <p className="mt-0.5 text-[14px] font-bold">
                {wind !== null ? `${Math.round(wind)} kph` : "—"}
              </p>
            </div>

            <div className="rounded-[16px] bg-white/5 border border-white/10 p-3">
              <CloudRain className="h-3.5 w-3.5 text-blue-300" />
              <p className="mt-2 text-[9px] uppercase tracking-wide text-white/45">
                Rain
              </p>
              <p className="mt-0.5 text-[14px] font-bold">
                {rainProbability !== null ? `${rainProbability}%` : "—"}
              </p>
            </div>

            <div className="rounded-[16px] bg-white/5 border border-white/10 p-3">
              <Eye className="h-3.5 w-3.5 text-blue-300" />
              <p className="mt-2 text-[9px] uppercase tracking-wide text-white/45">
                Visibility
              </p>
              <p className="mt-0.5 text-[14px] font-bold">
                Data pending
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* =========================================================
          SMART PACKING
         ========================================================= */}
      <div className="ios-card overflow-hidden">
        <div className="px-4 pt-5 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Luggage className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                Smart Packing
              </h2>

              <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                What the weather suggests you pack
              </p>
            </div>
          </div>
        </div>

        <div className="px-3.5 pb-4">
          <div className="rounded-[19px] bg-violet-500/[0.06] border border-violet-500/10 p-3.5">
            <p className="text-[12px] font-bold text-slate-900 dark:text-white">
              Packing for {selectedDestination}
            </p>

            <p className="mt-1 text-[10.5px] text-slate-500 dark:text-zinc-400">
              {rainProbability !== null && rainProbability >= 60
                ? "Rain is likely — prepare for wet conditions."
                : temp !== null && temp >= 30
                  ? "Warm conditions — choose light, breathable clothing."
                  : temp !== null && temp <= 12
                    ? "Cold conditions — pack warm layers."
                    : "Variable conditions — light layers are recommended."}
            </p>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {packingItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[17px] bg-ios-fill/60 dark:bg-ios-fill-dark/60 border border-slate-100 dark:border-zinc-800 p-3"
                >
                  <div className="h-8 w-8 rounded-[10px] bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                    <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>

                  <p className="mt-2.5 text-[10.5px] font-bold leading-tight text-slate-900 dark:text-white">
                    {item.title}
                  </p>

                  <p className="mt-1 text-[9px] leading-tight text-slate-500 dark:text-zinc-500">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* =========================================================
          DESTINATION CONDITIONS
         ========================================================= */}
      <div className="space-y-2.5">
        <div className="px-1">
          <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Destination Conditions
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
            Current weather at your active location
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">

          <div className="ios-card p-4">
            <div className="flex items-center justify-between">
              <CloudRain className="h-4 w-4 text-sky-500" />
              <span className="text-[9px] font-bold uppercase text-slate-400">
                Precipitation
              </span>
            </div>

            <p className="mt-3 text-[25px] font-black text-slate-950 dark:text-white">
              {rainProbability !== null ? `${rainProbability}%` : "—"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Rain probability
            </p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between">
              <Gauge className="h-4 w-4 text-violet-500" />
              <span className="text-[9px] font-bold uppercase text-slate-400">
                Humidity
              </span>
            </div>

            <p className="mt-3 text-[25px] font-black text-slate-950 dark:text-white">
              {humidity !== null ? `${humidity}%` : "—"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Relative humidity
            </p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-[9px] font-bold uppercase text-slate-400">
                Visibility
              </span>
            </div>

            <p className="mt-3 text-[20px] font-black text-slate-950 dark:text-white">
              Data pending
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Visibility telemetry
            </p>
          </div>

          <div className="ios-card p-4">
            <div className="flex items-center justify-between">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-[9px] font-bold uppercase text-slate-400">
                Temperature
              </span>
            </div>

            <p className="mt-3 text-[25px] font-black text-slate-950 dark:text-white">
              {temp !== null ? `${Math.round(temp)}°` : "—"}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              Current temperature
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

/* ===============================================================
   FAMILY MODE
   UI-FIRST VERSION
   Focus: school commute, rain alerts & severe weather.
   =============================================================== */

function FamilyDashboard({
  realTimeWeather,
}: {
  realTimeWeather: any;
}) {
  const temp = realTimeWeather?.numericTemp ?? null;
  const humidity = realTimeWeather?.numericHumidity ?? null;
  const wind = realTimeWeather?.numericWind ?? null;
  const rainProbability = realTimeWeather?.dailyPrecipProb ?? null;

  const rainRisk =
    rainProbability === null
      ? "Data unavailable"
      : rainProbability >= 70
        ? "Rain likely"
        : rainProbability >= 40
          ? "Possible rain"
          : "Low rain risk";

  const commuteStatus =
    rainProbability !== null && rainProbability >= 70
      ? {
          title: "Take Rain Gear",
          description: "Rain may affect the school commute.",
          className:
            "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300",
        }
      : wind !== null && wind >= 35
        ? {
            title: "Commute Caution",
            description: "Strong winds may make travel uncomfortable.",
            className:
              "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300",
          }
        : {
            title: "Good to Go",
            description: "No major weather concern for the commute.",
            className:
              "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300",
          };

  const outdoorStatus =
    temp !== null && temp >= 35
      ? "High heat"
      : rainProbability !== null && rainProbability >= 60
        ? "Rain risk"
        : "Comfortable";

  return (
    <div className="space-y-4">

      {/* =========================================================
          FAMILY HERO / DAILY PLAN
         ========================================================= */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-950 via-orange-950 to-slate-950 p-5 sm:p-6 text-white shadow-[0_20px_60px_-30px_rgba(244,63,94,0.45)]">

        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-rose-400/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-20 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative z-10">

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-[16px] bg-white/10 border border-white/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-rose-300" />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-rose-300">
                Family Weather
              </p>

              <h2 className="text-[22px] font-black tracking-tight">
                Plan Today
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-md text-[12px] leading-relaxed text-white/65">
            A quick view of conditions that matter for school, commuting
            and family activities.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold">
              🌡️ {temp !== null ? `${Math.round(temp)}°` : "—"}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold">
              🌧️ {rainProbability !== null ? `${rainProbability}% rain` : "Rain —"}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold">
              💧 {humidity !== null ? `${humidity}% humidity` : "Humidity —"}
            </span>
          </div>

        </div>
      </div>


      {/* =========================================================
          SCHOOL COMMUTE
         ========================================================= */}
      <div className="ios-card overflow-hidden">

        <div className="px-4 sm:px-5 pt-5 pb-4">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="h-10 w-10 rounded-[14px] bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <School className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                  School Commute
                </h2>

                <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                  Weather around school travel times
                </p>
              </div>

            </div>

            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase",
                commuteStatus.className
              )}
            >
              {commuteStatus.title}
            </span>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">

            {/* MORNING */}
            <div className="rounded-[19px] bg-ios-fill/60 dark:bg-ios-fill-dark/60 border border-slate-100 dark:border-zinc-800 p-3.5">

              <div className="flex items-center justify-between">
                <Clock className="h-4 w-4 text-orange-500" />

                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Morning
                </span>
              </div>

              <p className="mt-3 text-[18px] font-black text-slate-950 dark:text-white">
                School Drop-off
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">
                {rainProbability !== null && rainProbability >= 60
                  ? "Carry an umbrella or raincoat."
                  : "Weather looks suitable for the commute."}
              </p>

            </div>

            {/* AFTERNOON */}
            <div className="rounded-[19px] bg-ios-fill/60 dark:bg-ios-fill-dark/60 border border-slate-100 dark:border-zinc-800 p-3.5">

              <div className="flex items-center justify-between">
                <CloudRain className="h-4 w-4 text-sky-500" />

                <span className="text-[9px] font-bold uppercase text-slate-400">
                  Afternoon
                </span>
              </div>

              <p className="mt-3 text-[18px] font-black text-slate-950 dark:text-white">
                School Pickup
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">
                {rainProbability !== null && rainProbability >= 60
                  ? "Rain may affect pickup."
                  : "No significant rain signal."}
              </p>

            </div>

          </div>

          <div className="mt-3 rounded-[17px] bg-sky-500/[0.06] border border-sky-500/10 p-3.5">

            <div className="flex items-center gap-2">

              <CheckCircle2 className="h-4 w-4 text-emerald-500" />

              <p className="text-[11px] font-bold text-slate-900 dark:text-white">
                {commuteStatus.title}
              </p>

            </div>

            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">
              {commuteStatus.description}
            </p>

          </div>

        </div>
      </div>


      {/* =========================================================
          RAIN ALERT
         ========================================================= */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] border p-5",
          rainProbability !== null && rainProbability >= 60
            ? "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900"
            : "bg-white/80 border-slate-200 dark:bg-zinc-900/80 dark:border-zinc-800"
        )}
      >

        <div className="flex items-start gap-3">

          <div
            className={cn(
              "h-11 w-11 rounded-[14px] flex items-center justify-center shrink-0",
              rainProbability !== null && rainProbability >= 60
                ? "bg-sky-500 text-white"
                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-300"
            )}
          >
            <CloudRain className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">

            <div className="flex items-center justify-between gap-2">

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-400">
                  Rain Alert
                </p>

                <h2 className="mt-0.5 text-[17px] font-extrabold text-slate-950 dark:text-white">
                  {rainRisk}
                </h2>
              </div>

              <span className="text-[23px] font-black text-slate-950 dark:text-white">
                {rainProbability !== null
                  ? `${rainProbability}%`
                  : "—"}
              </span>

            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">

              {rainProbability !== null && rainProbability >= 70
                ? "Rain is likely. Keep umbrellas and raincoats ready for school travel."
                : rainProbability !== null && rainProbability >= 40
                  ? "There is a possibility of rain. Check conditions before leaving."
                  : "No significant rain risk is indicated right now."}

            </p>

          </div>

        </div>
      </div>


      {/* =========================================================
          SEVERE WEATHER
         ========================================================= */}
      <div className="ios-card overflow-hidden">

        <div className="px-4 sm:px-5 pt-5 pb-4">

          <div className="flex items-center gap-3">

            <div className="h-10 w-10 rounded-[14px] bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                Severe Weather
              </h2>

              <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                Important warnings for your family
              </p>
            </div>

          </div>

          <div className="mt-4 rounded-[19px] border border-emerald-500/15 bg-emerald-500/[0.06] p-4">

            <div className="flex items-center gap-3">

              <div className="h-9 w-9 rounded-[12px] bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div>
                <p className="text-[12px] font-bold text-slate-900 dark:text-white">
                  No active severe weather signal
                </p>

                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
                  Continue checking official warnings before major travel.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>


      {/* =========================================================
          FAMILY ACTIVITY
         ========================================================= */}
      <section className="space-y-2.5">

        <div className="px-1">
          <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Today&apos;s Family Plan
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
            Quick decisions for the day
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">

          <div className="ios-card p-4">

            <div className="flex items-center justify-between">
              <Sun className="h-4 w-4 text-amber-500" />

              <span className="text-[9px] font-bold uppercase text-slate-400">
                Outdoor
              </span>
            </div>

            <p className="mt-3 text-[17px] font-black text-slate-950 dark:text-white">
              {outdoorStatus}
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">
              Family activity conditions
            </p>

          </div>

          <div className="ios-card p-4">

            <div className="flex items-center justify-between">
              <Umbrella className="h-4 w-4 text-sky-500" />

              <span className="text-[9px] font-bold uppercase text-slate-400">
                Prepare
              </span>
            </div>

            <p className="mt-3 text-[17px] font-black text-slate-950 dark:text-white">
              {rainProbability !== null && rainProbability >= 60
                ? "Rain Gear"
                : "Normal Gear"}
            </p>

            <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">
              Based on today&apos;s conditions
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}
function AgricultureDashboard({
  realTimeWeather,
}: {
  realTimeWeather: any;
}) {
  const temperature = Number(realTimeWeather?.temperature ?? 0);
  const rainProbability = Number(
    realTimeWeather?.rainProbability ?? 0
  );
  const humidity = Number(realTimeWeather?.humidity ?? 0);

  // UI-level demo indicators for now.
  // Replace with actual agricultural data when the backend is connected.
  const soilMoisture = Math.min(
    85,
    Math.max(25, Math.round(humidity * 0.8))
  );

  const frostRisk =
    temperature <= 4
      ? "High Frost Risk"
      : temperature <= 8
        ? "Frost Watch"
        : "No Frost Risk";

  const plantingStatus =
    temperature >= 20 && temperature <= 32
      ? "Good planting conditions"
      : temperature < 15
        ? "Wait for warmer conditions"
        : "Monitor crop conditions";

  return (
    <section className="space-y-4">

      {/* AGRICULTURE HERO */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-700 via-green-600 to-lime-500 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-2xl bg-white/20 p-2.5">
              <Sprout size={22} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              Agriculture Mode
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Weather for your field
          </h2>

          <p className="mt-1 max-w-[280px] text-sm text-white/80">
            Make better planting and crop-care decisions with today's
            conditions.
          </p>
        </div>
      </div>

      {/* FIELD CONDITIONS */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-bold">
            Field Conditions
          </h3>

          <span className="text-[11px] text-muted-foreground">
            Today
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">

          {/* SOIL MOISTURE */}
          <div className="ios-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600">
                <Droplets size={19} />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Demo
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Soil Moisture
            </p>

            <div className="mt-1 flex items-end gap-1">
              <span className="text-2xl font-bold">
                {soilMoisture}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${soilMoisture}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Estimated from current conditions
            </p>
          </div>

          {/* RAINFALL */}
          <div className="ios-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                <CloudRain size={19} />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Forecast
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Rain Probability
            </p>

            <div className="mt-1 flex items-end gap-1">
              <span className="text-2xl font-bold">
                {rainProbability}%
              </span>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              {rainProbability >= 60
                ? "Rain likely — plan field work carefully"
                : rainProbability >= 30
                  ? "Possible rainfall"
                  : "Low rainfall chance"}
            </p>
          </div>

        </div>
      </div>

      {/* FROST ALERT */}
      <div
        className={`ios-card overflow-hidden ${
          temperature <= 8
            ? "border-blue-500/30"
            : ""
        }`}
      >
        <div className="flex items-center gap-3 p-4">
          <div
            className={`rounded-2xl p-3 ${
              temperature <= 8
                ? "bg-blue-500/10 text-blue-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Snowflake size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Frost Alert
            </p>

            <h3 className="mt-0.5 text-base font-bold">
              {frostRisk}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Current temperature: {temperature}°C
            </p>
          </div>

          <div
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              temperature <= 8
                ? "bg-blue-500/10 text-blue-600"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {temperature <= 8 ? "WATCH" : "CLEAR"}
          </div>
        </div>
      </div>

      {/* SEASONAL PLANTING */}
      <div className="ios-card overflow-hidden">
        <div className="border-b border-border/50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <Leaf size={21} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Seasonal Guidance
              </p>

              <h3 className="text-base font-bold">
                Planting Conditions
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4">

          <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3">
            <CalendarDays
              size={18}
              className="mt-0.5 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold">
                {plantingStatus}
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Consider temperature and rainfall conditions
                before planting or transplanting.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/5 p-3">
            <Tractor
              size={18}
              className="mt-0.5 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold">
                Field Work Advisory
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {rainProbability >= 60
                  ? "Consider postponing outdoor field work because of the higher rain probability."
                  : "Current conditions appear suitable for routine outdoor field activities."}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold">
          Farm Weather Tools
        </h3>

        <div className="grid grid-cols-3 gap-2">

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <Droplets
              size={19}
              className="text-blue-600"
            />
            <span className="text-[10px] font-semibold">
              Soil
            </span>
          </button>

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <CloudRain
              size={19}
              className="text-sky-600"
            />
            <span className="text-[10px] font-semibold">
              Rain
            </span>
          </button>

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <Leaf
              size={19}
              className="text-emerald-600"
            />
            <span className="text-[10px] font-semibold">
              Planting
            </span>
          </button>

        </div>
      </div>

    </section>
  );
}

function CommuterDashboard({
  realTimeWeather,
}: {
  realTimeWeather: any;
}) {
  const temperature = Number(realTimeWeather?.temperature ?? 0);
  const windSpeed = Number(realTimeWeather?.windSpeed ?? 0);
  const rainProbability = Number(
    realTimeWeather?.rainProbability ?? 0
  );

  // UI-only demo values until traffic/visibility APIs are connected.
  const visibility = "Data pending";

  const travelStatus =
    rainProbability >= 70 || windSpeed >= 35
      ? "Travel Conditions: Caution"
      : rainProbability >= 40
        ? "Travel Conditions: Watch"
        : "Travel Conditions: Good";

  const weatherAlert =
    rainProbability >= 70
      ? "Heavy Rain Risk"
      : windSpeed >= 35
        ? "Strong Wind Alert"
        : "No Major Weather Alert";

  return (
    <section className="space-y-4">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-800 via-slate-700 to-blue-700 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-2xl bg-white/15 p-2.5">
              <Car size={22} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              Commuter Mode
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Your commute, weather-aware
          </h2>

          <p className="mt-1 max-w-[290px] text-sm text-white/75">
            Check road conditions, visibility and weather risks
            before you leave.
          </p>

          <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1.5">
            <span className="text-xs font-semibold">
              {travelStatus}
            </span>
          </div>
        </div>
      </div>

      {/* COMMUTE CONDITIONS */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-bold">
            Commute Conditions
          </h3>

          <span className="text-[11px] text-muted-foreground">
            Current
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">

          {/* VISIBILITY */}
          <div className="ios-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
                <Eye size={19} />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Weather
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Visibility
            </p>

            <p className="mt-1 text-xl font-bold">
              {visibility}
            </p>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Important during fog, rain and storms
            </p>
          </div>

          {/* ROAD WEATHER */}
          <div className="ios-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-600">
                <Route size={19} />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Demo
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Road Weather
            </p>

            <p className="mt-1 text-xl font-bold">
              {rainProbability >= 60
                ? "Wet Roads"
                : "Mostly Clear"}
            </p>

            <p className="mt-2 text-[11px] text-muted-foreground">
              Based on current precipitation conditions
            </p>
          </div>

        </div>
      </div>

      {/* WEATHER TRAVEL ALERT */}
      <div
        className={`ios-card overflow-hidden ${
          rainProbability >= 70 || windSpeed >= 35
            ? "border-orange-500/30"
            : ""
        }`}
      >
        <div className="flex items-center gap-3 p-4">

          <div
            className={`rounded-2xl p-3 ${
              rainProbability >= 70 || windSpeed >= 35
                ? "bg-orange-500/10 text-orange-600"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            <AlertTriangle size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Travel Weather Alert
            </p>

            <h3 className="mt-0.5 text-base font-bold">
              {weatherAlert}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {rainProbability >= 70
                ? "Consider allowing extra travel time."
                : windSpeed >= 35
                  ? "Strong winds may affect travel conditions."
                  : "No major weather-related travel disruption detected."}
            </p>
          </div>

        </div>
      </div>

      {/* FOG & VISIBILITY */}
      <div className="ios-card p-4">
        <div className="flex items-center gap-3">

          <div className="rounded-2xl bg-slate-500/10 p-3 text-slate-600">
            <CloudFog size={21} />
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fog Watch
            </p>

            <h3 className="mt-0.5 text-base font-bold">
              Visibility Monitoring
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Visibility alerts can help commuters adjust
              departure times and drive more cautiously.
            </p>
          </div>

          <div className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold">
            MONITOR
          </div>

        </div>
      </div>

      {/* TRAFFIC + WEATHER */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold">
          Travel Intelligence
        </h3>

        <div className="ios-card divide-y divide-border/50 overflow-hidden">

          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-600">
              <TrafficCone size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Traffic Conditions
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Live traffic integration
              </p>
            </div>

            <span className="text-[10px] font-semibold text-muted-foreground">
              DATA PENDING
            </span>
          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
              <Navigation size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Weather-Aware Route
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Identify weather risks along your route
              </p>
            </div>

            <span className="text-[10px] font-semibold text-blue-600">
              PREVIEW
            </span>
          </div>

        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold">
          Commute Tools
        </h3>

        <div className="grid grid-cols-3 gap-2">

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <Route
              size={19}
              className="text-blue-600"
            />
            <span className="text-[10px] font-semibold">
              Route
            </span>
          </button>

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <Eye
              size={19}
              className="text-indigo-600"
            />
            <span className="text-[10px] font-semibold">
              Visibility
            </span>
          </button>

          <button className="ios-card flex flex-col items-center gap-2 p-3 text-center">
            <TrafficCone
              size={19}
              className="text-orange-600"
            />
            <span className="text-[10px] font-semibold">
              Traffic
            </span>
          </button>

        </div>
      </div>

    </section>
  );
}

function EventPlannerDashboard({
  realTimeWeather,
}: {
  realTimeWeather: any;
}) {
  const temperature = Number(realTimeWeather?.temperature ?? 0);
  const humidity = Number(realTimeWeather?.humidity ?? 0);
  const rainProbability = Number(
    realTimeWeather?.rainProbability ?? 0
  );
  const windSpeed = Number(realTimeWeather?.windSpeed ?? 0);

  /*
   * UI-level comfort calculation for the prototype.
   * This is NOT a clinical/scientific comfort index.
   */
  const humidityPenalty = Math.abs(humidity - 50) * 0.25;
  const windPenalty = Math.max(0, windSpeed - 15) * 0.5;

  const comfortIndex = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          Math.abs(temperature - 25) * 2 -
          humidityPenalty -
          windPenalty -
          rainProbability * 0.15
      )
    )
  );

  const comfortLabel =
    comfortIndex >= 80
      ? "Very Comfortable"
      : comfortIndex >= 65
        ? "Comfortable"
        : comfortIndex >= 45
          ? "Moderate Comfort"
          : "Low Outdoor Comfort";

  const eventRecommendation =
    rainProbability >= 70
      ? "Have an indoor backup plan"
      : rainProbability >= 40
        ? "Keep rain protection ready"
        : comfortIndex >= 70
          ? "Good for outdoor events"
          : "Plan with weather precautions";

  return (
    <section className="space-y-4">

      {/* EVENT HERO */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-500 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-2xl bg-white/15 p-2.5">
              <PartyPopper size={22} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              Event Planner Mode
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Plan around the weather
          </h2>

          <p className="mt-1 max-w-[290px] text-sm text-white/75">
            Make outdoor gatherings, weddings and events
            more weather-ready.
          </p>

          <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1.5">
            <span className="text-xs font-semibold">
              {eventRecommendation}
            </span>
          </div>
        </div>
      </div>

      {/* COMFORT INDEX */}
      <div className="ios-card overflow-hidden">
        <div className="p-4">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Outdoor Comfort
              </p>

              <h3 className="mt-1 text-lg font-bold">
                Comfort Index
              </h3>
            </div>

            <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600">
              <Thermometer size={22} />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">

            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[7px] border-violet-500/20">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {comfortIndex}
                </p>

                <p className="text-[9px] font-semibold uppercase text-muted-foreground">
                  / 100
                </p>
              </div>
            </div>

            <div>
              <p className="text-base font-bold">
                {comfortLabel}
              </p>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Based on temperature, humidity, wind and
                precipitation conditions.
              </p>
            </div>

          </div>

        </div>

        <div className="grid grid-cols-3 divide-x border-t border-border/50">

          <div className="p-3 text-center">
            <p className="text-lg font-bold">
              {temperature}°
            </p>
            <p className="text-[10px] text-muted-foreground">
              Temperature
            </p>
          </div>

          <div className="p-3 text-center">
            <p className="text-lg font-bold">
              {humidity}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              Humidity
            </p>
          </div>

          <div className="p-3 text-center">
            <p className="text-lg font-bold">
              {windSpeed}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Wind km/h
            </p>
          </div>

        </div>
      </div>

      {/* RAIN PROBABILITY */}
      <div className="ios-card p-4">

        <div className="flex items-center gap-3">

          <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600">
            <CloudRain size={21} />
          </div>

          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Rain Probability
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {rainProbability}%
              </span>

              <span className="text-xs text-muted-foreground">
                today
              </span>
            </div>
          </div>

          <div
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              rainProbability >= 70
                ? "bg-red-500/10 text-red-600"
                : rainProbability >= 40
                  ? "bg-orange-500/10 text-orange-600"
                  : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {rainProbability >= 70
              ? "HIGH"
              : rainProbability >= 40
                ? "WATCH"
                : "LOW"}
          </div>

        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-500"
            style={{
              width: `${rainProbability}%`,
            }}
          />
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {rainProbability >= 70
            ? "Rain may significantly affect outdoor arrangements."
            : rainProbability >= 40
              ? "Consider tents or alternate arrangements."
              : "Low probability of rain for outdoor activities."}
        </p>

      </div>

      {/* EXTENDED FORECAST */}
      <div className="ios-card overflow-hidden">

        <div className="border-b border-border/50 p-4">
          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-600">
              <CalendarCheck size={21} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Event Outlook
              </p>

              <h3 className="text-base font-bold">
                Extended Forecast
              </h3>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 p-4">

          {[
            { day: "Today", rain: rainProbability },
            { day: "Tomorrow", rain: "—" },
            { day: "Day 3", rain: "—" },
            { day: "Day 4", rain: "—" },
          ].map((item) => (
            <div
              key={item.day}
              className="rounded-2xl bg-muted/50 p-3 text-center"
            >
              <p className="text-[10px] font-semibold text-muted-foreground">
                {item.day}
              </p>

              <Sun
                size={18}
                className="mx-auto my-2 text-amber-500"
              />

              <p className="text-xs font-bold">
                {typeof item.rain === "number"
                  ? `${item.rain}%`
                  : item.rain}
              </p>

              <p className="mt-0.5 text-[9px] text-muted-foreground">
                rain
              </p>
            </div>
          ))}

        </div>

        <div className="px-4 pb-4">
          <p className="rounded-2xl bg-indigo-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
            Extended forecast helps planners decide whether
            to keep an event outdoors or prepare an alternative
            venue.
          </p>
        </div>

      </div>

      {/* EVENT READINESS */}
      <div>
        <h3 className="mb-2 px-1 text-sm font-bold">
          Event Readiness
        </h3>

        <div className="ios-card divide-y divide-border/50 overflow-hidden">

          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
              <CalendarCheck size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Outdoor Event
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {eventRecommendation}
              </p>
            </div>

            <span
              className={`text-[10px] font-bold ${
                comfortIndex >= 70
                  ? "text-emerald-600"
                  : "text-orange-600"
              }`}
            >
              {comfortIndex >= 70 ? "FAVOURABLE" : "PLAN AHEAD"}
            </span>
          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-600">
              <Umbrella size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Rain Protection
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {rainProbability >= 40
                  ? "Keep rain covers or an alternate venue ready."
                  : "No major rain preparation needed."}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600">
              <Clock size={19} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold">
                Best Planning Window
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Check hourly conditions before finalizing
                outdoor activities.
              </p>
            </div>

          </div>

        </div>
      </div>

    </section>
  );
}
export default function HomePage() {
  const { deviceId, user, logoutUser, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeExplanationRef, setActiveExplanationRef] = useState<string | null>(null);
  const [activeCardTitle, setActiveCardTitle] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("health");

  const {
    coords,
    locationName: locName,
    isLocating,
    isFallback: isLocationFallback,
    isPermanentlyDenied,
    retry: retryLocation,
  } = useGeolocation({ locale });

  const [locationNoticeDismissed, setLocationNoticeDismissed] = useState(false);

  const displayLocName = formatLocalizedLocation(
    isLocating ? t("common.loading") : locName,
    locale,
    t("common.loading")
  );

  const { data: userPrefs } = useQuery({
    queryKey: ["preferences", deviceId],
    queryFn: () => fetchPreferences(deviceId),
    enabled: !!deviceId,
  });

  const [tempUnit, setTempUnit] = useState<"c" | "f">("c");
  const [windUnit, setWindUnit] = useState<"kmh" | "mph">("kmh");

  useEffect(() => {
    const updateUnits = () => {
      const storedTemp = localStorage.getItem("mausam_temp_unit") as "c" | "f" | null;
      const storedWind = localStorage.getItem("mausam_wind_unit") as "kmh" | "mph" | null;
      if (storedTemp) setTempUnit(storedTemp);
      if (storedWind) setWindUnit(storedWind);
    };
    updateUnits();
    window.addEventListener("mausam_units_changed", updateUnits);
    window.addEventListener("storage", updateUnits);
    return () => {
      window.removeEventListener("mausam_units_changed", updateUnits);
      window.removeEventListener("storage", updateUnits);
    };
  }, []);

  const formatTemp = (celsius: number) => {
    if (tempUnit === "f") {
      return Math.round(celsius * 1.8 + 32);
    }
    return Math.round(celsius);
  };

  const formatWind = (kmh: number) => {
    if (windUnit === "mph") {
      return `${(kmh * 0.621371).toFixed(1)} mph`;
    }
    return `${kmh.toFixed(1)} kph`;
  };

  const userSelectedPersonaIds: string[] =
    userPrefs?.personas && userPrefs.personas.length > 0
      ? userPrefs.personas.filter((p: string) => p !== "default_general")
      : ["health"];

  const displayPersonaList =
    ALL_PERSONAS.filter((p) => userSelectedPersonaIds.includes(p.id)).length > 0
      ? ALL_PERSONAS.filter((p) => userSelectedPersonaIds.includes(p.id))
      : ALL_PERSONAS;

  useEffect(() => {
    if (userPrefs?.personas && userPrefs.personas.length > 0) {
      const filtered = userPrefs.personas.filter((p: string) => p !== "default_general");
      if (filtered.length > 0) {
        if (!filtered.includes(selectedPersona)) {
          setSelectedPersona(filtered[0]);
        }
      }
    }
  }, [userPrefs, selectedPersona]);

  const activeLat = coords.lat;
  const activeLon = coords.lon;

  const {
    data: homepageData,
    isLoading: hpLoading,
    isRefetching,
    error: hpError,
    refetch: refetchHomepage,
  } = useQuery({
    queryKey: ["homepage", deviceId, activeLat, activeLon],
    queryFn: () => fetchHomepage(deviceId, activeLat, activeLon),
    enabled: !!deviceId,
  });

  const cachedHomepage = useMemo(
    () => (hpError && deviceId ? readCachedHomepage(deviceId) : null),
    [hpError, deviceId]
  );

  const feedData = homepageData ?? cachedHomepage?.payload;
  const feedGeneratedAt = homepageData?.generated_at ?? cachedHomepage?.payload.generated_at ?? null;
  const feedSource = homepageData ? deriveFeedSource(homepageData.cards) : cachedHomepage ? "stale" : null;

  const {
    data: realTimeWeather,
    isLoading: rtLoading,
    error: rtError,
    refetch: refetchRealTime,
  } = useQuery({
    queryKey: ["realtime-weather", activeLat, activeLon, tempUnit, windUnit],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${activeLat}&longitude=${activeLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
      );
      if (!res.ok) throw new Error("Failed to fetch current weather");
      const data = await res.json();

      const isDaytime = data.current?.is_day === 1;

      const degToCompass = (deg: number) => {
        const val = Math.floor(deg / 22.5 + 0.5);
        const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr[val % 16];
      };

      const code = data.current?.weather_code ?? 0;
      const windDeg = data.current?.wind_direction_10m ?? 240;
      const humidityVal = Math.round(data.current?.relative_humidity_2m ?? 65);
      const rawTemp = data.current?.temperature_2m ?? 28;
      const rawFeelsLike = data.current?.apparent_temperature ?? 29.5;
      const rawWindKmh = data.current?.wind_speed_10m ?? 18.5;
      const rawPrecip = data.current?.precipitation ?? 0.0;
      const rawRain = data.current?.rain ?? 0.0;

      const rawHigh = data.daily?.temperature_2m_max?.[0] ?? 30;
      const rawLow = data.daily?.temperature_2m_min?.[0] ?? 22;
      const rawDailyRainProb = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 10);

      return {
        numericTemp: rawTemp,
        numericHumidity: humidityVal,
        numericWind: rawWindKmh,
        numericPrecip: rawPrecip,
        numericRain: rawRain,
        temp: formatTemp(rawTemp),
        unitSymbol: tempUnit === "f" ? "°F" : "°C",
        feelsLike: formatTemp(rawFeelsLike),
        isDay: isDaytime,
        humidity: humidityVal,
        humidityStatus: humidityVal > 75 ? "Humid" : humidityVal < 35 ? "Dry" : "Comfortable",
        precipitation: `${rawPrecip.toFixed(1)} mm`,
        rainFormatted: `${rawRain.toFixed(1)} mm`,
        windSpeed: formatWind(rawWindKmh),
        windDirection: `${degToCompass(windDeg)} Direction`,
        conditionStatus: formatLocalizedWmoCondition(code, isDaytime, t, rawPrecip),
        weatherCode: code,
        windDeg: windDeg,
        high: formatTemp(rawHigh),
        low: formatTemp(rawLow),
        dailyPrecipProb: rawDailyRainProb,
      };
    },
  });

  const { data: airQuality, refetch: refetchAirQuality } = useQuery({
    queryKey: ["air-quality", activeLat, activeLon],
    queryFn: async () => {
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${activeLat}&longitude=${activeLon}&current=us_aqi,uv_index`
      );
      if (!res.ok) throw new Error("Failed to fetch air quality data");
      const data = await res.json();
      return {
        aqi: data.current?.us_aqi ?? null,
        uvIndex: data.current?.uv_index ?? null,
      };
    },
  });

  const { data: explanationData, isLoading: expLoading } = useQuery({
    queryKey: ["explain", activeExplanationRef],
    queryFn: () => fetchExplanation(activeExplanationRef!),
    enabled: !!activeExplanationRef,
  });

  const switchPersonaMutation = useMutation({
    mutationFn: async (newPersona: string) => {
      setSelectedPersona(newPersona);
      const currentFlags = userPrefs?.health_flags || [];
      const otherPersonas = userSelectedPersonaIds.filter((p) => p !== newPersona);
      await updatePreferences({
        device_id: deviceId,
        personas: [newPersona, ...otherPersonas],
        health_flags: currentFlags,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage", deviceId] });
      queryClient.invalidateQueries({ queryKey: ["preferences", deviceId] });
    },
  });

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refetchHomepage(),
      refetchRealTime(),
      refetchAirQuality(),
    ]);
  }, [refetchHomepage, refetchRealTime, refetchAirQuality]);

  useEffect(() => {
    const onGlobalRefresh = () => {
      void refreshAll();
    };
    window.addEventListener("mausam_refresh_location", onGlobalRefresh);
    window.addEventListener("mausam_refresh_weather", onGlobalRefresh);
    return () => {
      window.removeEventListener("mausam_refresh_location", onGlobalRefresh);
      window.removeEventListener("mausam_refresh_weather", onGlobalRefresh);
    };
  }, [refreshAll]);

  const getPersonaCardConfig = (card: CardResponse) => {
    const cid = card.card_id.toLowerCase();

    if (cid.includes("severe") || cid.includes("warning")) {
      return {
        title: "Severe Weather Warning",
        bg: "bg-red-600",
        icon: <AlertTriangle className="w-5 h-5 text-white" />,
        category: "Alert",
      };
    }
    if (cid.includes("sunrise") || cid.includes("sunset") || cid.includes("daylight")) {
      return {
        title: "Daylight Hours",
        bg: "bg-orange-500",
        icon: <Sunrise className="w-5 h-5 text-white" />,
        category: "Sun",
      };
    }
    if (cid.includes("aqi")) {
      return {
        title: "Air Quality Index",
        bg: "bg-teal-500",
        icon: <Wind className="w-5 h-5 text-white" />,
        category: "Air Quality",
      };
    }
    if (cid.includes("clothing") || cid.includes("general") || cid.includes("temp")) {
      return {
        title: "Clothing & Gear",
        bg: "bg-blue-600",
        icon: <Shirt className="w-5 h-5 text-white" />,
        category: "Comfort",
      };
    }
    if (cid.includes("activity") || cid.includes("fitness") || cid.includes("exercise")) {
      return {
        title: "Exercise & Workout",
        bg: "bg-amber-500",
        icon: <Activity className="w-5 h-5 text-white" />,
        category: "Fitness",
      };
    }
    if (cid.includes("uv") || cid.includes("sun") || cid.includes("skincare")) {
      return {
        title: "Skincare & Sun",
        bg: "bg-cyan-500",
        icon: <Sun className="w-5 h-5 text-white" />,
        category: "Skincare",
      };
    }
    if (cid.includes("rain") || cid.includes("commute") || cid.includes("driving")) {
      return {
        title: "Driving & Commute",
        bg: "bg-sky-500",
        icon: <Car className="w-5 h-5 text-white" />,
        category: "Commute",
      };
    }
    if (cid.includes("pollen")) {
      return {
        title: "Pollen Allergen Risk",
        bg: "bg-purple-500",
        icon: <Flower2 className="w-5 h-5 text-white" />,
        category: "Allergen",
      };
    }

    return {
      title: card.title,
      bg: "bg-indigo-500",
      icon: <CloudSun className="w-5 h-5 text-white" />,
      category: "Personalized",
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ios-grouped dark:bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-ios-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activePersonaObj = displayPersonaList.find((p) => p.id === selectedPersona) || displayPersonaList[0];
  const ActivePersonaIcon = activePersonaObj.icon;
  const activeTheme = PERSONA_THEME[selectedPersona as keyof typeof PERSONA_THEME] ?? PERSONA_THEME.health;
  const isHealthMode = selectedPersona === "health";
  const topWarning = feedData?.warnings_override?.[0];

  const shareData: ForecastShareData = {
    locationName: displayLocName,
    temperature: realTimeWeather?.numericTemp ?? null,
    unitSymbol: tempUnit === "f" ? "°F" : "°C",
    condition: realTimeWeather ? translateConditionString(realTimeWeather.conditionStatus, t) : null,
    high: realTimeWeather ? Number(realTimeWeather.high) : null,
    low: realTimeWeather ? Number(realTimeWeather.low) : null,
    rainProbability: realTimeWeather?.dailyPrecipProb ?? null,
    aqi: airQuality?.aqi ?? null,
    uvIndex: airQuality?.uvIndex ?? null,
    warning: topWarning ? { type: topWarning.type, severity: topWarning.severity, text: topWarning.text } : null,
  };

  return (
    <PullToRefresh onRefresh={refreshAll}>
      <div
        data-persona={selectedPersona}
        className={cn(
          "relative min-h-screen text-ios-label dark:text-ios-label-dark flex flex-col overflow-x-hidden",
          "selection:bg-ios-blue selection:text-white pb-24 lg:pb-16 ios-safe-bottom",
          "transition-[background-color,background-image] duration-500 ease-out",
          activeTheme.canvas
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden">
          <div className={cn("absolute -left-24 top-24 h-64 w-64 rounded-full blur-3xl transition-colors duration-500", activeTheme.glow)} />
          <div className="absolute -right-28 top-16 h-80 w-80 rounded-full bg-cyan-200/15 blur-3xl dark:bg-cyan-400/5" />
          {isHealthMode && (
            <>
              <div className="absolute -left-8 top-[300px] h-24 w-10 rotate-[28deg] rounded-[100%_0_100%_0] bg-emerald-300/20 dark:bg-emerald-400/10" />
              <div className="absolute left-16 top-[350px] h-16 w-8 rotate-[-34deg] rounded-[100%_0_100%_0] bg-teal-300/20 dark:bg-teal-400/10" />
              <div className="absolute right-6 top-[320px] h-20 w-9 rotate-[35deg] rounded-[100%_0_100%_0] bg-cyan-300/15 dark:bg-cyan-400/10" />
            </>
          )}
        </div>

        {/* Top Action Bar */}
        <header className="ios-nav sticky top-0 z-40 w-full px-4 sm:px-8 pb-2 ios-safe-top">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center">
              <MobileMenuTrigger />
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex-1 space-y-5">
          <OfflineBanner
            cachedAt={cachedHomepage?.cachedAt}
            hasFailedRequest={!!hpError}
            onRetry={() => void refreshAll()}
          />

          {isLocationFallback && !locationNoticeDismissed && (
            <LocationFallbackNotice
              fallbackName={locName}
              onRetry={isPermanentlyDenied ? undefined : retryLocation}
              onDismiss={() => setLocationNoticeDismissed(true)}
            />
          )}

          {homepageData && (
            <StaleDataBanner
              source={feedSource}
              generatedAt={feedGeneratedAt}
              onRefresh={() => void refreshAll()}
            />
          )}

          {/* P0 Severe Warnings Bar */}
          {feedData?.warnings_override && feedData.warnings_override.length > 0 && (
            <div className="space-y-3">
              {feedData.warnings_override.map((w, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 bg-ios-red text-white rounded-ios-card shadow-[0_8px_28px_-8px_rgba(255,59,48,0.55)] flex items-start gap-3.5"
                >
                  <div className="p-2.5 bg-white/20 rounded-ios shrink-0">
                    <ShieldAlert className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-white text-ios-red font-semibold text-[10px] uppercase tracking-wider">
                        {t("home.p0Warning")}
                      </span>
                      <span className="text-[11px] text-white/80 font-semibold uppercase tracking-wide">
                        {w.type} • {w.severity}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-[15px] leading-snug tracking-[-0.011em]">
                      {w.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Responsive Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Main Persona Section */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              <section className="space-y-5">
                {/* PERSONA HERO CARD — High Contrast Light/Dark Version */}
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[30px] p-5 sm:p-7",
                    "border shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)]",
                    "transition-all duration-500 ease-out",
                    activeTheme.hero,
                    isHealthMode && "min-h-[205px] sm:min-h-[225px]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl opacity-60 transition-colors duration-500",
                      activeTheme.glow
                    )}
                  />

                  {isHealthMode && (
                    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
                      <div className="absolute right-[18%] top-8 h-16 w-8 rotate-[38deg] rounded-[100%_0_100%_0] bg-emerald-400/25" />
                      <div className="absolute right-[8%] top-24 h-24 w-11 rotate-[-26deg] rounded-[100%_0_100%_0] bg-teal-400/20" />
                      <div className="absolute -right-3 bottom-2 h-20 w-9 rotate-[24deg] rounded-[100%_0_100%_0] bg-cyan-400/20" />
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-[19px]",
                            "backdrop-blur-xl border flex items-center justify-center shadow-sm",
                            isHealthMode
                              ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-600 dark:bg-emerald-400/10 dark:border-emerald-300/15 dark:text-emerald-300"
                              : "bg-slate-900/10 border-slate-900/15 text-slate-950 dark:bg-white/10 dark:border-white/15 dark:text-white"
                          )}
                        >
                          <ActivePersonaIcon
  className="h-7 w-7 sm:h-8 sm:w-8"
/>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full shrink-0",
                                isHealthMode ? "bg-emerald-500" : "bg-slate-900/70 dark:bg-white/70"
                              )}
                            />
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900/80 dark:text-white/70">
                              Personalized weather
                            </p>
                          </div>

                          <h1 className="mt-1 text-[28px] sm:text-[34px] font-bold tracking-[-0.045em] leading-none text-slate-950 dark:text-white">
                            {activePersonaObj.shortTitle} Mode
                          </h1>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push("/settings")}
                        className="ios-pressable h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-slate-900/10 border border-slate-900/15 text-slate-900 hover:bg-slate-900/20 dark:bg-white/10 dark:border-white/15 dark:text-white transition-all flex items-center justify-center"
                        aria-label="Manage personalization"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="mt-3.5 max-w-xl text-[13px] sm:text-[14.5px] font-medium leading-relaxed text-slate-900/90 dark:text-white/80">
                      {isHealthMode
                        ? "Cleaner air. Safer sun. A healthier you."
                        : activePersonaObj.subtitle}
                    </p>

                    <div className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold bg-slate-900/10 border-slate-900/15 text-slate-950 dark:bg-white/10 dark:border-white/15 dark:text-white shadow-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{displayLocName}</span>
                    </div>
                  </div>
                </div>

                {/* PERSONA SWITCHER */}
                <div className="space-y-2.5">
                  <div className="flex items-end justify-between px-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold tracking-[-0.015em] text-ios-label dark:text-ios-label-dark">
                          Your Focus
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold",
                            activeTheme.pill
                          )}
                        >
                          {activePersonaObj.shortTitle}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                        Switch your weather perspective
                      </p>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-semibold text-ios-label-3 dark:text-ios-label-3-dark">
                      {displayPersonaList.length} {displayPersonaList.length === 1 ? "focus" : "focuses"}
                    </span>
                  </div>

                  <div
                    className="flex gap-2 overflow-x-auto px-0.5 pb-1.5 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x"
                    role="tablist"
                    aria-label="Weather perspectives"
                  >
                    {displayPersonaList.map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedPersona === p.id;

                      return (
                        <button
                          key={p.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          aria-label={`Select ${p.title} persona`}
                          disabled={switchPersonaMutation.isPending}
                          onClick={() => {
                            if (p.id !== selectedPersona) {
                              switchPersonaMutation.mutate(p.id);
                            }
                          }}
                          className={cn(
                            "ios-pressable shrink-0 snap-start",
                            "h-11 px-3.5 sm:px-4 rounded-[16px]",
                            "flex items-center gap-2",
                            "text-[12px] sm:text-[13px] font-semibold",
                            "border transition-all duration-200",
                            isSelected
                              ? cn(activeTheme.pill, "border-transparent")
                              : "bg-white/85 dark:bg-zinc-900/90 text-slate-600 dark:text-zinc-300 border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                          )}
                        >
                          <span
                            className={cn(
                              "h-6 w-6 rounded-[9px] flex items-center justify-center",
                              isSelected
                                ? "bg-white/10 dark:bg-slate-950/10"
                                : "bg-slate-100 dark:bg-zinc-800"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                          </span>
                          <span>{p.shortTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PERSONA DASHBOARD VIEWS */}
                {selectedPersona === "health" ? (
                  <section className="space-y-4">
                    {/* HEALTH EXPOSURE MATRIX */}
                    <HealthExposureMatrix realTimeWeather={realTimeWeather} airQuality={airQuality} />

                    {/* HEALTH CHECK */}
                    <div className="ios-card overflow-hidden">
                      <div className="px-4 sm:px-5 pt-5 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-[14px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ShieldAlert className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                              Today&apos;s Health Check
                            </h2>
                            <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                              A quick read of today&apos;s conditions
                            </p>
                          </div>
                        </div>
                      </div>

                      {rtLoading || !realTimeWeather ? (
                        <div className="px-3.5 pb-4 space-y-2">
                          <SkeletonCardRow />
                          <SkeletonCardRow />
                          <SkeletonCardRow />
                        </div>
                      ) : (
                        <div className="px-3.5 sm:px-4 pb-4">
                          <div className="divide-y divide-slate-200/70 dark:divide-zinc-800 rounded-[18px] border border-slate-100 dark:border-zinc-800 bg-ios-fill/45 dark:bg-ios-fill-dark/45 overflow-hidden">
                            <div className="flex items-center gap-3 px-3.5 py-3">
                              <div className="h-9 w-9 rounded-[12px] bg-emerald-500 flex items-center justify-center shrink-0">
                                <Wind className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-bold text-ios-label dark:text-ios-label-dark">
                                  Breathing conditions
                                </p>
                                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ios-label-2 dark:text-ios-label-2-dark">
                                  {airQuality?.aqi == null
                                    ? "Air quality data is currently unavailable."
                                    : airQuality.aqi <= 50
                                      ? "Good conditions for normal outdoor activity."
                                      : airQuality.aqi <= 100
                                        ? "Satisfactory; sensitive users may prefer shorter exposure."
                                        : "Consider limiting prolonged outdoor exposure."}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                                {airQuality?.aqi == null ? "—" : airQuality.aqi <= 100 ? "OK" : "CAUTION"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 px-3.5 py-3">
                              <div className="h-9 w-9 rounded-[12px] bg-sky-500 flex items-center justify-center shrink-0">
                                <Sun className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-bold text-ios-label dark:text-ios-label-dark">
                                  Sun exposure
                                </p>
                                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ios-label-2 dark:text-ios-label-2-dark">
                                  {airQuality?.uvIndex == null
                                    ? "UV information is currently unavailable."
                                    : airQuality.uvIndex < 3
                                      ? "UV exposure is currently low."
                                      : airQuality.uvIndex < 6
                                        ? "Moderate UV; protection helps during longer outdoor periods."
                                        : "High UV; prioritize shade and sun protection."}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-sky-500/10 px-2 py-1 text-[9px] font-semibold text-sky-700 dark:text-sky-400">
                                {airQuality?.uvIndex == null
                                  ? "—"
                                  : airQuality.uvIndex < 3
                                    ? "LOW"
                                    : airQuality.uvIndex < 6
                                      ? "MODERATE"
                                      : "HIGH"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 px-3.5 py-3">
                              <div className="h-9 w-9 rounded-[12px] bg-violet-500 flex items-center justify-center shrink-0">
                                <Gauge className="h-4 w-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-bold text-ios-label dark:text-ios-label-dark">
                                  Comfort
                                </p>
                                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ios-label-2 dark:text-ios-label-2-dark">
                                  {realTimeWeather.humidityStatus} humidity at {realTimeWeather.numericHumidity}% with a temperature of {realTimeWeather.temp}{realTimeWeather.unitSymbol}.
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-semibold text-violet-700 dark:text-violet-400">
                                TODAY
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HEALTH ALERTS CARDS */}
                    <div className="ios-card overflow-hidden">
                      <div className="px-4 sm:px-5 pt-5 pb-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                              Health Alerts
                            </h2>
                            <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                              Additional weather factors
                            </p>
                          </div>
                          <span className="hidden sm:inline-flex rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                            More details
                          </span>
                        </div>
                      </div>

                      <div className="px-3.5 sm:px-4 pb-4 space-y-2.5">
                        {hpLoading ? (
                          <SkeletonRegion label={t("common.loading")} className="space-y-2.5">
                            <SkeletonCardRow />
                            <SkeletonCardRow />
                            <SkeletonCardRow />
                          </SkeletonRegion>
                        ) : hpError && !feedData ? (
                          <DataErrorState error={hpError} onRetry={() => void refetchHomepage()} />
                        ) : feedData?.cards && feedData.cards.length > 0 ? (
                          feedData.cards.map((card) => {
                            const cfg = getPersonaCardConfig(card);

                            return (
                              <button
                                key={card.card_id}
                                type="button"
                                onClick={() => {
                                  setActiveCardTitle(cfg.title);
                                  setActiveExplanationRef(card.explanation_ref);
                                }}
                                className="ios-pressable-card group w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[18px] bg-ios-fill/55 dark:bg-ios-fill-dark/55 text-left border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-700/80 transition-all"
                              >
                                <div
                                  className={cn(
                                    "h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-[15px]",
                                    cfg.bg,
                                    "flex items-center justify-center shadow-sm"
                                  )}
                                >
                                  {cfg.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14px] sm:text-[15px] font-bold tracking-[-0.012em] text-ios-label dark:text-ios-label-dark truncate">
                                      {cfg.title}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                                        card.priority === "P0" &&
                                          "bg-red-500/10 text-red-600 border-red-500/15 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/15",
                                        card.priority === "P1" &&
                                          "bg-amber-500/10 text-amber-700 border-amber-500/15 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/15",
                                        card.priority === "P2" &&
                                          "bg-blue-500/10 text-blue-600 border-blue-500/15 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/15",
                                        card.priority === "P3" &&
                                          "bg-slate-100 text-slate-500 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                      )}
                                    >
                                      {card.priority}
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-[12px] leading-snug text-ios-label-2 dark:text-ios-label-2-dark truncate mt-1">
                                    {card.value_summary}
                                  </p>
                                </div>

                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-ios-label-3 dark:text-ios-label-3-dark group-hover:translate-x-0.5 transition-transform"
                                  strokeWidth={2.5}
                                />
                              </button>
                            );
                          })
                        ) : (
                          <NoDataState
                            onChangeLocation={() => router.push("/map")}
                            onRetry={() => void refetchHomepage()}
                          />
                        )}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-4">
                    {/* RUNNER / ATHLETE SNAPSHOT */}
                    {selectedPersona === "fitness" && (
                      <RunnerHUDView realTimeWeather={realTimeWeather} airQuality={airQuality} />
                    )}
                    {/* BEACH / SURF MODE */}
{selectedPersona === "beach" && (
  <BeachSurfTelemetryMatrix
    realTimeWeather={realTimeWeather}
    airQuality={airQuality}
  />
)}
{/* TRAVELER MODE */}
{selectedPersona === "traveler" && (
  <TravelerDashboard
    realTimeWeather={realTimeWeather}
    airQuality={airQuality}
    currentLocation={displayLocName}
  />
)}
{selectedPersona === "family" && (
  <FamilyDashboard
    realTimeWeather={realTimeWeather}
  />
)}

{selectedPersona === "agriculture" && (
  <AgricultureDashboard
    realTimeWeather={realTimeWeather}
  />
)}
{selectedPersona === "commuter" && (
  <CommuterDashboard
    realTimeWeather={realTimeWeather}
  />
)}

{selectedPersona === "event" && (
  <EventPlannerDashboard
    realTimeWeather={realTimeWeather}
  />
)}


                    {/* OTHER PERSONA CARDS */}
                    <div className="ios-card overflow-hidden">
                      <div className="px-4 sm:px-5 pt-5 pb-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-[14px] flex items-center justify-center",
                                activePersonaObj.id === "fitness" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                activePersonaObj.id === "beach" && "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
                                activePersonaObj.id === "traveler" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                activePersonaObj.id === "family" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                                activePersonaObj.id === "agriculture" && "bg-lime-500/10 text-lime-700 dark:text-lime-400",
                                activePersonaObj.id === "commuter" && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                                activePersonaObj.id === "event" && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              )}
                            >
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                              <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                                Your Priorities
                              </h2>
                              <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                                Ranked for {activePersonaObj.shortTitle.toLowerCase()}
                              </p>
                            </div>
                          </div>

                          <span className="hidden sm:inline-flex rounded-full bg-ios-fill dark:bg-ios-fill-dark px-2.5 py-1 text-[10px] font-semibold text-ios-label-2 dark:text-ios-label-2-dark">
                            Personalized
                          </span>
                        </div>
                      </div>

                      <div className="px-3.5 sm:px-4 pb-4 space-y-2.5">
                        {hpLoading ? (
                          <SkeletonRegion label={t("common.loading")} className="space-y-2.5">
                            <SkeletonCardRow />
                            <SkeletonCardRow />
                            <SkeletonCardRow />
                          </SkeletonRegion>
                        ) : hpError && !feedData ? (
                          <DataErrorState error={hpError} onRetry={() => void refetchHomepage()} />
                        ) : feedData?.cards && feedData.cards.length > 0 ? (
                          feedData.cards.map((card) => {
                            const cfg = getPersonaCardConfig(card);

                            const priorityStyles: Record<string, string> = {
                              P0: "bg-red-500/10 text-red-600 dark:text-red-400",
                              P1: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                              P2: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                              P3: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300",
                            };

                            return (
                              <button
                                key={card.card_id}
                                type="button"
                                onClick={() => {
                                  setActiveCardTitle(cfg.title);
                                  setActiveExplanationRef(card.explanation_ref);
                                }}
                                className="ios-pressable-card group w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[18px] bg-ios-fill/55 dark:bg-ios-fill-dark/55 text-left border border-transparent hover:border-slate-200/80 dark:hover:border-zinc-700/80 transition-all"
                              >
                                <div
                                  className={cn(
                                    "h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-[15px]",
                                    cfg.bg,
                                    "flex items-center justify-center shadow-sm"
                                  )}
                                >
                                  {cfg.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14px] sm:text-[15px] font-bold tracking-[-0.012em] text-ios-label dark:text-ios-label-dark truncate">
                                      {cfg.title}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                                        priorityStyles[card.priority] ?? priorityStyles.P3
                                      )}
                                    >
                                      {card.priority}
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-[12px] leading-snug text-ios-label-2 dark:text-ios-label-2-dark truncate mt-1">
                                    {card.value_summary}
                                  </p>
                                </div>

                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-ios-label-3 dark:text-ios-label-3-dark group-hover:translate-x-0.5 transition-transform"
                                  strokeWidth={2.5}
                                />
                              </button>
                            );
                          })
                        ) : (
                          <NoDataState
                            onChangeLocation={() => router.push("/map")}
                            onRetry={() => void refetchHomepage()}
                          />
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* PERSONA INSIGHTS */}
                <div className="ios-card overflow-hidden">
                  <div className="px-4 sm:px-5 pt-5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[14px] bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <Compass className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-[17px] font-bold tracking-[-0.025em] text-ios-label dark:text-ios-label-dark">
                          {activePersonaObj.shortTitle} Insights
                        </h2>
                        <p className="mt-0.5 text-[11px] text-ios-label-2 dark:text-ios-label-2-dark">
                          Weather interpreted for your needs
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-3.5 sm:px-4 pb-5">
                    {rtLoading || !realTimeWeather ? (
                      <SkeletonRegion label={t("common.loading")} className="space-y-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-16 w-full rounded-ios" />
                        <Skeleton className="h-16 w-full rounded-ios" />
                      </SkeletonRegion>
                    ) : (
                      <PersonaInsightsSection
                        persona={selectedPersona}
                        currentTemp={realTimeWeather.numericTemp}
                        humidity={realTimeWeather.numericHumidity}
                        windSpeed={realTimeWeather.numericWind}
                        precipitation={realTimeWeather.numericPrecip}
                        rainProbability={realTimeWeather.dailyPrecipProb}
                        aqi={airQuality?.aqi ?? undefined}
                        uvIndex={airQuality?.uvIndex ?? undefined}
                        locationName={displayLocName}
                        conditionText={realTimeWeather.conditionStatus}
                        tempUnit={tempUnit}
                        windUnit={windUnit}
                      />
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Live Ambient Weather */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              <div className="ios-card-raised p-5 sm:p-6 space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-ios-blue dark:text-ios-blue-dark shrink-0" strokeWidth={2.25} />
                    <span className="text-[13px] font-semibold text-ios-label dark:text-ios-label-dark truncate max-w-[170px]">
                      {displayLocName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isRefetching && (
                      <RefreshCw
                        className="w-3 h-3 text-ios-blue dark:text-ios-blue-dark animate-spin"
                        aria-label={t("refresh.refreshing")}
                      />
                    )}
                    <ShareButton data={shareData} />
                  </div>
                </div>

                <FreshnessIndicator source={feedSource} generatedAt={feedGeneratedAt} className="-mt-3" />

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    {rtLoading || !realTimeWeather ? (
                      <SkeletonRegion label={t("common.loading")} className="space-y-2">
                        <Skeleton className="h-11 sm:h-14 w-32" />
                        <Skeleton className="h-3 w-44" />
                        <Skeleton className="h-2.5 w-28" />
                      </SkeletonRegion>
                    ) : (
                      <>
                        <div className="ios-numeric text-[56px] sm:text-[64px] font-thin text-ios-label dark:text-ios-label-dark tracking-[-0.03em] leading-[0.95]">
                          {formatTemp(realTimeWeather.numericTemp)}°
                          <span className="text-[0.4em] font-light align-top ml-0.5">
                            {tempUnit.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[15px] font-medium text-ios-label-2 dark:text-ios-label-2-dark mt-1 tracking-[-0.011em]">
                          {translateConditionString(realTimeWeather.conditionStatus, t)}
                        </p>
                        <div className="ios-footnote mt-0.5 ios-numeric">
                          {t("common.feelsLike")} {realTimeWeather.feelsLike}° · {t("common.high")}{" "}
                          {realTimeWeather.high}° · {t("common.low")} {realTimeWeather.low}°
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative shrink-0 flex items-center justify-center">
                    {!realTimeWeather || realTimeWeather.isDay ? (
                      <svg viewBox="0 0 140 140" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="homeSunGrad" x1="15%" y1="10%" x2="85%" y2="90%">
                            <stop offset="0%" stopColor="#FFB300" />
                            <stop offset="60%" stopColor="#FB8C00" />
                            <stop offset="100%" stopColor="#F57C00" />
                          </linearGradient>
                          <linearGradient id="homeCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#E2E8F0" />
                          </linearGradient>
                        </defs>
                        <circle cx="56" cy="65" r="42" fill="url(#homeSunGrad)" />
                        <path
                          d="M62 88h36c6.6 0 12-5.4 12-12 0-5.8-4.2-10.7-9.8-11.8C108.6 57 101.4 50 92.5 50c-6.8 0-12.7 4.1-15.3 10-1.7-.6-3.4-1-5.2-1-7.7 0-14 6.3-14 14 0 .9.1 1.8.3 2.7C54.8 77.2 52 82.2 52 88z"
                          fill="url(#homeCloudGrad)"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 140 140" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="homeMoonGrad" x1="20%" y1="10%" x2="80%" y2="90%">
                            <stop offset="0%" stopColor="#93c5fd" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                          <linearGradient id="homeNightCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#CBD5E1" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M70 20 C46 28 36 50 42 74 C47 88 56 95 66 97 C52 88 47 72 52 56 C56 40 63 28 70 20 Z"
                          fill="url(#homeMoonGrad)"
                        />
                        <path
                          d="M58 88h40c6.6 0 12-5.4 12-12 0-5.8-4.2-10.7-9.8-11.8C98.6 57 91.4 50 82.5 50c-6.8 0-12.7 4.1-15.3 10-1.7-.6-3.4-1-5.2-1-7.7 0-14 6.3-14 14 0 .9.1 1.8.3 2.7C44.8 77.2 42 82.2 42 88z"
                          fill="url(#homeNightCloudGrad)"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {rtLoading || !realTimeWeather ? (
                  <Skeleton className="h-3 w-full" />
                ) : (
                  <p className="ios-footnote leading-relaxed ios-numeric">
                    {t("metrics.humidity")} {realTimeWeather.numericHumidity}% ·{" "}
                    {t("metrics.wind")} {formatWind(realTimeWeather.numericWind)} ·{" "}
                    {t("metrics.rain")} {realTimeWeather.dailyPrecipProb}%
                    {airQuality?.uvIndex !== undefined && airQuality?.uvIndex !== null
                      ? ` · UV ${airQuality.uvIndex.toFixed(1)}`
                      : ""}
                  </p>
                )}

                {rtError && (
                  <DataErrorState error={rtError} onRetry={() => void refetchRealTime()} />
                )}

                <button
                  type="button"
                  onClick={() => router.push("/weather")}
                  className="ios-pressable w-full py-3 px-4 bg-ios-blue dark:bg-ios-blue-dark text-white rounded-ios font-semibold text-[15px] tracking-[-0.011em] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{t("home.viewDashboard")}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* EXPLANATION DRAWER MODAL */}
        {activeExplanationRef && (
          <div
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setActiveExplanationRef(null)}
          >
            <div
              className="relative z-10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200/90 dark:border-zinc-800 max-w-lg w-full p-6 pb-8 sm:pb-6 rounded-t-[28px] rounded-b-none sm:rounded-2xl space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 ios-safe-bottom shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
                    <Sparkles className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Why this was ranked
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{activeCardTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveExplanationRef(null)}
                  className="ios-pressable h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={2.25} />
                </button>
              </div>

              {expLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2.5">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500 dark:text-zinc-400">Computing decision audit...</span>
                </div>
              ) : explanationData ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800/80 text-[14px] text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {explanationData.text}
                  </div>

                  {explanationData.score_components && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70">
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                          Persona Wt
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                          {explanationData.score_components.persona_weight?.toFixed(2) ?? "1.00"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                          Urgency Mult
                        </div>
                        <div className="font-bold text-amber-600 dark:text-amber-400 text-base mt-0.5">
                          {explanationData.score_components.urgency_multiplier?.toFixed(2) ?? "1.00"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                          Confidence
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base mt-0.5">
                          {explanationData.score_components.confidence_factor?.toFixed(2) ?? "1.00"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-zinc-400 text-center py-4">Explanation details unavailable.</p>
              )}

              <button
                type="button"
                onClick={() => setActiveExplanationRef(null)}
                className="ios-pressable w-full py-2.5 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white transition-colors cursor-pointer shadow-sm"
              >
                Close Audit
              </button>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}