import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./layouts/AppShell";
import AgentCasePage from "./pages/AgentCasePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import FinancePage from "./pages/FinancePage";
import Image2VideoPage from "./pages/Image2VideoPage";
import PortfolioPage from "./pages/PortfolioPage";
import StockConceptPage from "./pages/StockConceptPage";
import TradingPersonaPage from "./pages/TradingPersonaPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortfolioPage />} />
      <Route path="/agent/:caseId" element={<AgentCasePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="stock-concepts" element={<StockConceptPage />} />
          <Route path="image-to-video" element={<Image2VideoPage />} />
          <Route path="trading-persona" element={<TradingPersonaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
