import { NavLink } from "react-router-dom";
import { useI18n } from "../i18n";

const item = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
    isActive ? "text-brand-700" : "text-slate-500"
  }`;

export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        <NavLink to="/" end className={item}>
          <span className="text-2xl" aria-hidden>🏠</span>
          {t("nav.dashboard")}
        </NavLink>
        <NavLink to="/members" end className={item}>
          <span className="text-2xl" aria-hidden>👥</span>
          {t("nav.members")}
        </NavLink>
        <NavLink to="/add" className={item}>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-3xl leading-none text-white shadow-md"
            aria-hidden
          >
            +
          </span>
          {t("nav.add")}
        </NavLink>
        <NavLink to="/settings" className={item}>
          <span className="text-2xl" aria-hidden>⚙️</span>
          {t("nav.settings")}
        </NavLink>
      </div>
    </nav>
  );
}
