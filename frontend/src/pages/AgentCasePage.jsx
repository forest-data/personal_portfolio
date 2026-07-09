import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Code2,
  Database,
  GitBranch,
  Layers3,
  MessageSquareText,
  Route,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import portfolio from "../data/portfolio.json";

export default function AgentCasePage() {
  const { caseId } = useParams();
  const agentCase = portfolio.agentCases?.[caseId];

  if (!agentCase) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="agent-case-page">
      <nav className="agent-case-nav">
        <Link to="/" className="portfolio-secondary-btn">
          <ArrowLeft size={16} />
          返回作品集
        </Link>
        <div className="portfolio-source-path">
          <Code2 size={15} />
          {agentCase.source}
        </div>
      </nav>

      <section className="agent-case-hero">
        <div>
          <p className="portfolio-kicker">
            <Bot size={16} />
            Static Agent Demo
          </p>
          <h1>{agentCase.title}</h1>
          <p className="portfolio-tagline">{agentCase.subtitle}</p>
          <p className="portfolio-summary">{agentCase.overview}</p>
        </div>

        <div className="agent-case-demo-card">
          <div className="agent-case-demo-head">
            <MessageSquareText size={18} />
            <span>模拟用户问题</span>
          </div>
          <p>{agentCase.demo.question}</p>
        </div>
      </section>

      <section className="portfolio-stat-grid">
        {agentCase.metrics.map((item) => (
          <article className="portfolio-stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="agent-case-layout">
        <article className="agent-case-panel agent-case-answer">
          <div className="agent-case-panel-head">
            <Route size={18} />
            <div>
              <p className="portfolio-project-category">Route Result</p>
              <h2>{agentCase.demo.route}</h2>
            </div>
          </div>

          <div className="agent-case-meta-grid">
            <div>
              <span>参与 Agent</span>
              <strong>{agentCase.demo.agents.join(" / ")}</strong>
            </div>
            <div>
              <span>cache_hit</span>
              <strong>{agentCase.demo.cacheHit}</strong>
            </div>
          </div>

          <div className="agent-case-answer-box">
            <span>静态模拟回答</span>
            <p>{agentCase.demo.answer}</p>
          </div>
        </article>

        <article className="agent-case-panel">
          <div className="agent-case-panel-head">
            <GitBranch size={18} />
            <div>
              <p className="portfolio-project-category">Trace</p>
              <h2>执行链路</h2>
            </div>
          </div>

          <div className="agent-case-trace">
            {agentCase.trace.map((step, index) => (
              <div className="agent-case-trace-row" key={`${step.phase}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.phase}</strong>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="agent-case-panel">
        <div className="agent-case-panel-head">
          <Database size={18} />
          <div>
            <p className="portfolio-project-category">API / Tool Contract</p>
            <h2>接口与返回结构</h2>
          </div>
        </div>

        <div className="agent-case-code-grid">
          <CodeBlock title={`${agentCase.apiExample.method} ${agentCase.apiExample.endpoint}`}>
            {agentCase.apiExample.body}
          </CodeBlock>
          <CodeBlock title="Response">
            {agentCase.apiExample.response}
          </CodeBlock>
        </div>
      </section>

      <section className="agent-case-info-grid">
        {agentCase.panels.map((panel) => (
          <article className="agent-case-panel" key={panel.title}>
            <div className="agent-case-panel-head">
              <Layers3 size={18} />
              <div>
                <p className="portfolio-project-category">Design Notes</p>
                <h2>{panel.title}</h2>
              </div>
            </div>
            <div className="agent-case-check-list">
              {panel.items.map((item) => (
                <div key={item}>
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function CodeBlock({ title, children }) {
  return (
    <div className="agent-case-code-card">
      <span>{title}</span>
      <pre>{children}</pre>
    </div>
  );
}
