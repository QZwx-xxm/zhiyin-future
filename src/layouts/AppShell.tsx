import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import logoZhihang from "../assets/logo-zhihang.png";

const studentNav = [
  { to: "/dashboard", label: "工作台" },
  { to: "/resume", label: "简历诊断" },
  { to: "/job-match", label: "岗位匹配" },
  { to: "/video-call", label: "视频通话" },
  { to: "/share", label: "分享区" },
  { to: "/discussion", label: "讨论区" },
];

const teacherNav = [{ to: "/teacher", label: "教师端分析" }];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, logout } = useAppContext();
  const nav = role === "teacher" ? teacherNav : studentNav;
  const displayName = profile?.name ?? "演示账号";
  const displayRole = role === "teacher" ? "就业指导教师" : profile?.targetRole ?? "学生用户";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img className="brand-mark" src={logoZhihang} alt="职引未来" />
          <div>
            <strong>职引未来</strong>
            <p>大学生就业与简历优化智能服务平台</p>
          </div>
        </div>

        <nav className="nav-list">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <strong>{displayName}</strong>
            <span>{displayRole}</span>
          </div>
          <button className="ghost-button" onClick={logout}>
            退出登录
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
