import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Code2,
  Database,
  ExternalLink,
  Github,
  Layers3,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import portfolio from "../data/portfolio.json";

const projectIcons = [Layers3, Database, BookOpenText, Sparkles, Rocket];

export default function PortfolioPage() {
  const { profile, heroStats, skills, projects, timeline, changeNotes } = portfolio;

  return (
    <main className="portfolio-page">
      <nav className="portfolio-nav" aria-label="作品集导航">
        <a className="portfolio-brand" href="#top">
          <span>
            <Sparkles size={18} />
          </span>
          {profile.name}
        </a>
        <div className="portfolio-nav-links">
          <a href="#projects">项目</a>
          <a href="#skills">技能</a>
          <a href="#notes">备注</a>
          <Link to="/login">登录演示</Link>
        </div>
      </nav>

      <section className="portfolio-hero" id="top">
        <div className="portfolio-hero-copy">
          <div className="portfolio-kicker">
            <BadgeCheck size={16} />
            Personal Portfolio / AI Pro
          </div>
          <h1>{profile.role}</h1>
          <p className="portfolio-tagline">{profile.tagline}</p>
          <p className="portfolio-summary">{profile.summary}</p>

          <div className="portfolio-actions">
            <a className="portfolio-primary-btn" href="#projects">
              查看作品
              <ArrowRight size={16} />
            </a>
            <a
              className="portfolio-secondary-btn"
              href={profile.repository}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} />
              GitHub 仓库
            </a>
          </div>
        </div>

        <aside className="portfolio-profile-card">
          <div className="portfolio-avatar" aria-hidden="true">
            FD
          </div>
          <p>{profile.name}</p>
          <strong>{profile.location}</strong>
          <span>{profile.tagline}</span>
          <a href={profile.github} target="_blank" rel="noreferrer">
            <Github size={16} />
            forest-data
          </a>
        </aside>
      </section>

      <section className="portfolio-stat-grid" aria-label="作品集概览">
        {heroStats.map((item) => (
          <article className="portfolio-stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.note}</p>
          </article>
        ))}
      </section>

      <section className="portfolio-section" id="projects">
        <div className="portfolio-section-head">
          <p className="portfolio-kicker">Selected Projects</p>
          <h2>可直接打开演示的作品模块</h2>
          <p>
            这些模块都来自当前项目，既能作为 GitHub 源码作品，也能本地启动后进入后台体验。
          </p>
        </div>

        <div className="portfolio-project-grid">
          {projects.map((project, index) => {
            const Icon = projectIcons[index % projectIcons.length];
            return (
              <article className="portfolio-project-card" key={project.title}>
                <div className="portfolio-project-top">
                  <div className="portfolio-project-icon">
                    <Icon size={20} />
                  </div>
                  <span>{project.status}</span>
                </div>
                <p className="portfolio-project-category">{project.category}</p>
                <h3>{project.title}</h3>
                <p className="portfolio-project-desc">{project.description}</p>

                <ul className="portfolio-highlight-list">
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>

                <div className="portfolio-tech-list">
                  {project.techStack.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>

                <Link className="portfolio-card-link" to={project.route}>
                  进入演示
                  <ExternalLink size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="portfolio-two-column" id="skills">
        <div className="portfolio-panel">
          <div className="portfolio-section-head compact">
            <p className="portfolio-kicker">Skill Stack</p>
            <h2>技能关键词</h2>
          </div>
          <div className="portfolio-skill-cloud">
            {skills.map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>

        <div className="portfolio-panel">
          <div className="portfolio-section-head compact">
            <p className="portfolio-kicker">Build Path</p>
            <h2>项目演进</h2>
          </div>
          <div className="portfolio-timeline">
            {timeline.map((item) => (
              <article className="portfolio-timeline-item" key={item.title}>
                <span>{item.time}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-section portfolio-notes" id="notes">
        <div className="portfolio-section-head">
          <p className="portfolio-kicker">Change Notes</p>
          <h2>本次作品集化改动备注</h2>
          <p>这些备注也同步写入 README，方便在 GitHub 仓库首页直接看到。</p>
        </div>
        <div className="portfolio-note-grid">
          {changeNotes.map((note) => (
            <article className="portfolio-note-card" key={note}>
              <Code2 size={18} />
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
