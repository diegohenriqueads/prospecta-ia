import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProspectingPage } from "@/pages/ProspectingPage";
import { CompaniesPage } from "@/pages/CompaniesPage";
import { KanbanPage } from "@/pages/KanbanPage";
import { CompanyDetailPage } from "@/pages/CompanyDetailPage";

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/prospeccao" element={<ProspectingPage />} />
              <Route path="/empresas" element={<CompaniesPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/empresas/:id" element={<CompanyDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
