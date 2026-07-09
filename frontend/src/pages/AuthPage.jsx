import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.pathname || "/app";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (isLogin) {
        await login({
          email: form.email,
          password: form.password,
        });
      } else {
        await register(form);
      }
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "请求失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-showcase">
        <div className="auth-showcase-badge">
          <Sparkles size={16} />
          参考现代 AI SaaS 工作台风格
        </div>
        <h1>让 Image2Video 成为系统中的一个能力模块</h1>
        <p>
          这一版先搭出统一登录、注册、主系统工作台和 Image2Video
          功能入口，方便你继续扩展更多 AI 工具模块。
        </p>

        <div className="auth-showcase-grid">
          <div className="showcase-card">
            <span>01</span>
            <strong>统一账号入口</strong>
            <p>支持注册、登录和基础身份态持久化。</p>
          </div>
          <div className="showcase-card">
            <span>02</span>
            <strong>系统级工作台</strong>
            <p>用侧栏和卡片式布局承载多个业务能力。</p>
          </div>
          <div className="showcase-card">
            <span>03</span>
            <strong>能力模块化</strong>
            <p>Image2Video 现在是可独立进入的功能页。</p>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-header">
            <p className="auth-card-kicker">Aether Studio</p>
            <h2>{isLogin ? "欢迎回来" : "创建账号"}</h2>
            <p>{isLogin ? "登录后进入你的 AI 内容工作台" : "注册后即可开始使用系统功能"}</p>
          </div>

          {!isLogin && (
            <label className="auth-field">
              <span>昵称</span>
              <input
                type="text"
                placeholder="请输入昵称"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>邮箱</span>
            <input
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="auth-field">
            <span>密码</span>
            <input
              type="password"
              placeholder="至少 6 位"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          {isLogin ? (
            <div className="auth-demo-box">
              <div>
                <strong>体验账号</strong>
                <p>可直接用演示账号快速进入系统预览整体工作台。</p>
              </div>
              <button
                type="button"
                className="auth-demo-btn"
                onClick={() =>
                  setForm({
                    name: "",
                    email: "demo@qq.com",
                    password: "123456",
                  })
                }
              >
                demo@qq.com / 123456
              </button>
            </div>
          ) : null}

          <button className="auth-submit-btn" type="submit" disabled={submitting}>
            {submitting ? "提交中..." : isLogin ? "登录进入系统" : "注册并进入系统"}
            {!submitting && <ArrowRight size={16} />}
          </button>

          <p className="auth-switch-text">
            {isLogin ? "还没有账号？" : "已经有账号了？"}
            <Link to={isLogin ? "/register" : "/login"}>
              {isLogin ? "去注册" : "去登录"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
