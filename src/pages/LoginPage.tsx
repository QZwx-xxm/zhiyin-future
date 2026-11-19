import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { RegisterPayload, Role } from "../types";
import logoZhihang from "../assets/logo-zhihang.png";

type Mode = "login" | "register";

const initialRegister: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  role: "student",
};

export function LoginPage() {
  const navigate = useNavigate();
  const { loadAccounts, loginWithPassword, register, loading, saving, error, successMessage, clearMessage } =
    useAppContext();
  const [mode, setMode] = useState<Mode>("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>(initialRegister);

  useEffect(() => {
    loadAccounts().catch(() => undefined);
  }, []);

  useEffect(() => {
    clearMessage();
  }, [mode]);

  const handlePasswordLogin = async () => {
    const role = await loginWithPassword(loginForm.email.trim(), loginForm.password);
    navigate(role === "teacher" ? "/teacher" : "/dashboard");
  };

  const handleRegister = async () => {
    await register({
      ...registerForm,
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
    });
    setMode("login");
    setLoginForm({ email: registerForm.email.trim(), password: "" });
    setRegisterForm(initialRegister);
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <img className="login-logo" src={logoZhihang} alt="职引未来" />
        <span className="eyebrow">大学生就业准备平台</span>
        <h1>职引未来</h1>
        <p>
          简历、AI 诊断、岗位匹配、模拟面试与社区，帮大学生把求职准备做完整。
        </p>
        <div className="hero-tags">
          <span>MySQL 数据库存储</span>
          <span>学生真实注册登录</span>
          <span>结构化简历编辑</span>
          <span>教师端统计分析</span>
        </div>
      </div>

      <div className="login-panel card">
        <div className="auth-switch">
          <button
            className={mode === "login" ? "primary-button" : "secondary-button"}
            onClick={() => setMode("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={mode === "register" ? "primary-button" : "secondary-button"}
            onClick={() => setMode("register")}
            type="button"
          >
            注册
          </button>
        </div>

        {mode === "login" ? (
          <>
            <div>
              <h2>账号登录</h2>
              <p className="muted">学生和教师都可以注册账号，登录后直接进入对应工作台。</p>
            </div>

            <div className="form-stack">
              <label className="field-block">
                <span>邮箱 <em>*</em></span>
                <input
                  className="search-input"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="请输入邮箱"
                />
              </label>
              <label className="field-block">
                <span>密码 <em>*</em></span>
                <input
                  className="search-input"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="请输入密码"
                />
              </label>
              <button className="primary-button" onClick={handlePasswordLogin} disabled={saving}>
                {saving ? "登录中..." : "登录进入平台"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2>创建账号</h2>
              <p className="muted">注册信息将保存到本地数据库，注册后可直接登录使用。</p>
            </div>

            <div className="form-stack">
              <label className="field-block">
                <span>用户名 / 昵称 <em>*</em></span>
                <input
                  className="search-input"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="例如：李同学"
                />
              </label>
              <label className="field-block">
                <span>邮箱 <em>*</em></span>
                <input
                  className="search-input"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="例如：student@example.com"
                />
              </label>
              <label className="field-block">
                <span>密码 <em>*</em></span>
                <input
                  className="search-input"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="至少 6 位"
                />
              </label>
              <label className="field-block">
                <span>身份 <em>*</em></span>
                <select
                  className="search-input"
                  value={registerForm.role}
                  onChange={(event) => setRegisterForm((prev) => ({ ...prev, role: event.target.value as Role }))}
                >
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                </select>
              </label>
              <button className="primary-button" onClick={handleRegister} disabled={saving}>
                {saving ? "注册中..." : "注册账号"}
              </button>
            </div>
          </>
        )}

        {loading ? <p className="muted">正在加载账号信息...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {successMessage ? <p className="success-text">{successMessage}</p> : null}
      </div>
    </div>
  );
}
