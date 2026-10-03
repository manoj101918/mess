import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { WakeUpGate } from "./components/WakeUpGate";
import { I18nProvider } from "./i18n";
import AddMember from "./pages/AddMember";
import Dashboard from "./pages/Dashboard";
import EditMember from "./pages/EditMember";
import MemberDetail from "./pages/MemberDetail";
import Members from "./pages/Members";
import Renew from "./pages/Renew";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <I18nProvider>
      <WakeUpGate>
        <BrowserRouter>
          <div className="mx-auto min-h-dvh max-w-md bg-slate-50" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberDetail />} />
              <Route path="/members/:id/edit" element={<EditMember />} />
              <Route path="/members/:id/renew" element={<Renew />} />
              <Route path="/add" element={<AddMember />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <BottomNav />
        </BrowserRouter>
      </WakeUpGate>
    </I18nProvider>
  );
}
