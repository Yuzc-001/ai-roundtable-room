import { Logo } from './components.jsx';
import { getLocalizedReleaseNotes, LANDING_SITE } from './data/landingPages.js';
import { SCENARIO_GUIDE } from './data/scenarioGuide.js';
import { getLandingPath } from './lib/landingRoutes.js';

const GITHUB_URL = 'https://github.com/Yuzc-001/ai-roundtable-room';
const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`;

function LandingNav({ copy, page, onNavigate, onToggleLang, onEnter }) {
  return (
    <header className="landing-nav">
      <button type="button" className="landing-brand landing-brand-btn" onClick={() => onNavigate('home')}>
        <Logo />
        <span>{copy.brand}</span>
      </button>
      <nav>
        {copy.nav.map((item) => (
          <a
            key={item.id}
            href={getLandingPath(item.id)}
            className={page === item.id ? 'is-active' : ''}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="landing-nav-actions">
        <button type="button" className="btn btn-ghost landing-lang" onClick={onToggleLang}>{copy.language}</button>
        <a className="btn btn-ghost" href={GITHUB_URL} target="_blank" rel="noreferrer">{copy.github}</a>
        <button type="button" className="btn btn-primary" onClick={onEnter}>{copy.primary}</button>
      </div>
    </header>
  );
}

function LandingBack({ label, onNavigate }) {
  return (
    <button type="button" className="landing-back btn btn-ghost" onClick={() => onNavigate('home')}>
      ← {label}
    </button>
  );
}

function LandingScenarioGuide({ copy, lang, onNavigate, onEnter }) {
  const g = SCENARIO_GUIDE[lang] ?? SCENARIO_GUIDE.zh;
  return (
    <article className="landing-doc landing-guide">
      <LandingBack label={copy.backHome} onNavigate={onNavigate} />
      <h1>{g.title}</h1>
      <p className="landing-doc-lead">{g.lead}</p>
      {g.sections.map((sec) => (
        <section key={sec.title} className="landing-guide-section">
          <h2>{sec.title}</h2>
          <p>{sec.body}</p>
          {sec.examples?.length > 0 && (
            <div className="landing-guide-examples">
              {sec.examples.map((ex) => (
                <blockquote key={ex}>{ex}</blockquote>
              ))}
            </div>
          )}
        </section>
      ))}
      <section className="landing-guide-checklist">
        <h2>提交前自检</h2>
        <ul>
          {g.checklist.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
      <div className="landing-cta-row landing-guide-cta">
        <button type="button" className="btn btn-primary" onClick={onEnter}>{g.ctaWorkbench}</button>
        <button type="button" className="btn btn-ghost" onClick={() => onNavigate('scenarios')}>查看适用场景</button>
      </div>
    </article>
  );
}

function LandingHome({ copy, onNavigate, onEnter, onDemo }) {
  const h = copy.home;
  return (
    <>
      <section className="landing-hero landing-animate-in">
        <p className="landing-kicker">{h.heroKicker}</p>
        <h1>{h.title}</h1>
        <p className="landing-deck">{h.deck}</p>
        <div className="landing-cta-row">
          <button type="button" className="btn btn-primary landing-cta" onClick={onEnter}>{copy.primary}</button>
          <button type="button" className="btn btn-ghost landing-cta" onClick={onDemo}>{copy.demo}</button>
        </div>
      </section>
      <section className="landing-shot landing-animate-in landing-animate-in--delay-1">
        <img src="/remotion/home-2026-05.png" alt={h.shotAlt} loading="lazy" />
      </section>
      <section className="landing-explore landing-animate-in landing-animate-in--delay-2">
        <h2>{h.exploreTitle}</h2>
        <div className="landing-explore-grid">
          {h.explore.map(([title, desc, id], idx) => (
            <button
              key={id}
              type="button"
              className="landing-explore-card landing-animate-in"
              style={{ animationDelay: `${0.15 * idx + 0.25}s` }}
              onClick={() => onNavigate(id)}
            >
              <b>{title}</b>
              <span>{desc}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="landing-install landing-install--compact landing-animate-in landing-animate-in--delay-3">
        <h2>{h.quickstartTitle}</h2>
        <p>{h.quickstartLead}</p>
        <pre className="landing-code"><code>{h.quickstartLines.join('\n')}</code></pre>
      </section>
    </>
  );
}

function LandingScenarios({ copy, onNavigate }) {
  const p = copy.scenarios;
  return (
    <article className="landing-doc">
      <LandingBack label={copy.backHome} onNavigate={onNavigate} />
      <h1>{p.title}</h1>
      <p className="landing-doc-lead">{p.lead}</p>
      <div className="landing-doc-grid">
        {p.items.map((item) => (
          <section key={item.title} className="landing-doc-card">
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <h3>示例议题</h3>
            <ul>
              {item.examples.map((ex) => <li key={ex}>{ex}</li>)}
            </ul>
            <p className="landing-doc-fit">{item.fit}</p>
          </section>
        ))}
      </div>
      <section className="landing-doc-aside">
        <h2>{p.notForTitle}</h2>
        <ul>
          {p.notFor.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </article>
  );
}

function LandingWorkflow({ copy, onNavigate }) {
  const p = copy.workflow;
  return (
    <article className="landing-doc">
      <LandingBack label={copy.backHome} onNavigate={onNavigate} />
      <h1>{p.title}</h1>
      <p className="landing-doc-lead">{p.lead}</p>
      <section className="landing-phases">
        <h2>六个阶段</h2>
        <ol className="landing-phase-list">
          {p.phases.map(([name, desc], index) => (
            <li key={name}>
              <span className="landing-phase-num">{index + 1}</span>
              <div>
                <b>{name}</b>
                <p>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="landing-doc-steps">
        <h2>你怎么操作</h2>
        <ol>
          {p.steps.map(([title, body]) => (
            <li key={title}><b>{title}</b><span>{body}</span></li>
          ))}
        </ol>
      </section>
      <section className="landing-doc-aside">
        <h2>{p.artifactTitle}</h2>
        <ul className="landing-tag-list">
          {p.artifacts.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </article>
  );
}

function LandingFaq({ copy, onNavigate }) {
  const p = copy.faq;
  return (
    <article className="landing-doc">
      <LandingBack label={copy.backHome} onNavigate={onNavigate} />
      <h1>{p.title}</h1>
      <p className="landing-doc-lead">{p.lead}</p>
      <div className="landing-faq-list landing-faq-list--page">
        {p.items.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <section className="landing-support-block">
        <h2>{p.supportTitle}</h2>
        <div className="landing-support">
          {p.support.map(([title, body, href]) => (
            <a key={title} href={href} target="_blank" rel="noreferrer">
              <b>{title}</b>
              <span>{body}</span>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}

function LandingUpdates({ copy, lang, onNavigate, currentVersion }) {
  const p = copy.updates;
  const versionLabel = copy.version ?? currentVersion;
  const releaseNotes = getLocalizedReleaseNotes(lang);
  return (
    <article className="landing-doc">
      <LandingBack label={copy.backHome} onNavigate={onNavigate} />
      <h1>{p.title}</h1>
      <p className="landing-doc-lead">{p.lead}</p>
      <p className="landing-current-version">
        {p.currentLabel}：<b>{versionLabel}</b>
        {' · '}
        <a href={CHANGELOG_URL} target="_blank" rel="noreferrer">CHANGELOG.md</a>
      </p>
      <div className="landing-releases">
        {releaseNotes.map((release) => (
          <section key={release.version} className="landing-release">
            <header>
              <h2>v{release.version}</h2>
              <time dateTime={release.date}>{release.date}</time>
            </header>
            <ul>
              {release.highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}

export default function LandingSite({
  page,
  lang,
  currentVersion,
  onNavigate,
  onToggleLang,
  onEnter,
  onDemo,
}) {
  const copy = LANDING_SITE[lang] ?? LANDING_SITE.zh;

  return (
    <div className="landing-shell">
      <LandingNav
        copy={copy}
        page={page}
        onNavigate={onNavigate}
        onToggleLang={onToggleLang}
        onEnter={onEnter}
      />
      <main className="landing-main">
        {page === 'home' && (
          <LandingHome copy={copy} onNavigate={onNavigate} onEnter={onEnter} onDemo={onDemo} />
        )}
        {page === 'scenarios' && <LandingScenarios copy={copy} onNavigate={onNavigate} />}
        {page === 'scenarioGuide' && (
          <LandingScenarioGuide
            copy={copy}
            lang={lang}
            onNavigate={onNavigate}
            onEnter={onEnter}
          />
        )}
        {page === 'workflow' && <LandingWorkflow copy={copy} onNavigate={onNavigate} />}
        {page === 'faq' && <LandingFaq copy={copy} onNavigate={onNavigate} />}
        {page === 'updates' && (
          <LandingUpdates copy={copy} lang={lang} onNavigate={onNavigate} currentVersion={currentVersion} />
        )}
      </main>
      <footer className="landing-footer">
        <span>{copy.footer}</span>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">github.com/Yuzc-001/ai-roundtable-room</a>
      </footer>
    </div>
  );
}