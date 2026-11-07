import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { BacktestingPage } from "@/pages/backtesting";
import { ModulePlaceholder } from "@/pages/module-placeholder";
import { OverviewPage } from "@/pages/overview";
import { PaperTradingPage } from "@/pages/paper-trading";
import { StrategiesPage } from "@/pages/strategies";
import { WorkspaceProvider } from "@/state/workspace";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkspaceProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="backtesting" element={<BacktestingPage />} />
            <Route path="paper-trading" element={<PaperTradingPage />} />
            <Route path="*" element={<ModulePlaceholder />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkspaceProvider>
  </StrictMode>,
);
