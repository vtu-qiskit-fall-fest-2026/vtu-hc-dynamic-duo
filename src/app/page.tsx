"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, NavView } from "@/components/layout/Sidebar";
import { MoscaTheoremBanner } from "@/components/dashboard/MoscaTheoremBanner";
import { QuantumRiskHeatmap } from "@/components/dashboard/QuantumRiskHeatmap";
import { QkdSimulatorModule } from "@/components/dashboard/QkdSimulatorModule";
import { HybridPqcRemediationPanel } from "@/components/dashboard/HybridPqcRemediationPanel";
import { CbomSummaryTable } from "@/components/dashboard/CbomSummaryTable";
import { CbomInventoryView } from "@/components/cbom/CbomInventoryView";
import { MitigationPrsView } from "@/components/mitigation/MitigationPrsView";
import { QkdDeepSimulatorView } from "@/components/simulator/QkdDeepSimulatorView";
import { PolicySettingsView } from "@/components/settings/PolicySettingsView";
import { CbomDetailDrawer } from "@/components/cbom/CbomDetailDrawer";
import { QuickSearchModal } from "@/components/common/QuickSearchModal";
import { CbomItem } from "@/lib/mock-cbom-data";
import { fetchDashboardSummary, DashboardSummary } from "@/lib/api";

export default function Home() {
  const [currentView, setCurrentView] = useState<NavView>("dashboard");
  const [currentEnv, setCurrentEnv] = useState<string>("prod-us-east-1");
  const [selectedAsset, setSelectedAsset] = useState<CbomItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary().then((data) => {
      if (data) setSummary(data);
    });
  }, []);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      {/* Top Header */}
      <Header
        currentEnv={currentEnv}
        onEnvChange={setCurrentEnv}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          openPrsCount={2}
          criticalCbomCount={summary?.shor_vulnerable_critical ?? 142}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
          {currentView === "dashboard" && (
            <>
              {/* 1. Mosca's Theorem KPI Banner (Top Row) */}
              <MoscaTheoremBanner
                onViewCbomClick={() => setCurrentView("cbom")}
                onRemediateClick={() => setCurrentView("mitigation")}
              />

              {/* 2. Middle Row: Quantum Risk Heatmap (Left) + BB84 QKD Simulator (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7">
                  <QuantumRiskHeatmap
                    onSelectAsset={setSelectedAsset}
                    selectedAssetId={selectedAsset?.id}
                  />
                </div>
                <div className="lg:col-span-5">
                  <QkdSimulatorModule
                    onOpenDeepView={() => setCurrentView("qkd-simulator")}
                  />
                </div>
              </div>

              {/* 3. Bottom Row: Hybrid PQC Remediation Panel (Left) + CBOM Summary Table (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-6">
                  <HybridPqcRemediationPanel
                    onOpenPrView={() => setCurrentView("mitigation")}
                  />
                </div>
                <div className="lg:col-span-6">
                  <CbomSummaryTable
                    onSelectAsset={setSelectedAsset}
                    onViewAllCbom={() => setCurrentView("cbom")}
                  />
                </div>
              </div>
            </>
          )}

          {currentView === "cbom" && <CbomInventoryView />}

          {currentView === "mitigation" && <MitigationPrsView />}

          {currentView === "qkd-simulator" && <QkdDeepSimulatorView />}

          {currentView === "settings" && <PolicySettingsView />}
        </main>
      </div>

      {/* Global CBOM Detail Drawer */}
      <CbomDetailDrawer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onDeploySidecar={() => setCurrentView("dashboard")}
        onGeneratePr={() => setCurrentView("mitigation")}
      />

      {/* Quick Search Modal (Ctrl+K) */}
      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAsset={setSelectedAsset}
        onNavigate={setCurrentView}
      />
    </div>
  );
}
