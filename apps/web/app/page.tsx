'use client';

import { useState } from 'react';
import { tenants as defaultTenants, competencies } from '@credbridge/contracts';

const fmt = (n: number) => n.toLocaleString('en-US');

interface ActivityEvent {
  title: string;
  sub: string;
  tenant: string;
  credit: string;
  time: string;
  color: 'mint' | 'blue' | 'peach' | 'violet';
}

const initialEvents: ActivityEvent[] = [
  {
    title: 'Credential issued',
    sub: 'Venture Validation Badge',
    tenant: 'Gulf University of Innovation',
    credit: '1 credit',
    time: '2m ago',
    color: 'mint',
  },
  {
    title: 'Credit reserved',
    sub: 'Workplace Readiness',
    tenant: 'Emirates Applied Polytechnic',
    credit: '1 credit',
    time: '18m ago',
    color: 'blue',
  },
  {
    title: 'Credential verified',
    sub: 'Co-op Digital Readiness',
    tenant: 'Northern Polytechnic Institute',
    credit: '—',
    time: '42m ago',
    color: 'violet',
  },
  {
    title: 'Credit released',
    sub: 'Placement Debrief Retry',
    tenant: 'Emirates Applied Polytechnic',
    credit: '1 credit',
    time: '1h ago',
    color: 'peach',
  },
];

export default function Home() {
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [tenantsState, setTenantsState] = useState(defaultTenants);
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [sandboxModal, setSandboxModal] = useState<boolean>(false);
  const [sandboxLog, setSandboxLog] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const used = tenantsState.reduce((a, t) => a + t.used, 0);
  const totalPool = 10000;
  const remainingCredits = totalPool - used;
  const poolUtilization = Math.round((used / totalPool) * 100);

  const t = {
    en: {
      eyebrow: 'ADMIN CENTRAL • SYNTHETIC REFERENCE DATA',
      h1: 'International credentialing, in one view.',
      sub: 'A shared credit pool for portable skills, trusted outcomes, and global mobility.',
      heroContract: '24-MONTH SHARED CONTRACT',
      heroValue: '$5,400',
      heroCopy: 'Seeded pool across 3 international pilots',
      creditsRemaining: 'credits\nremaining',
      poolUtilization: 'Pool utilization',
      alertThreshold: 'Alert threshold at 85%',
      portfolioPulse: 'PORTFOLIO PULSE',
      whatsMoving: 'What’s moving this month',
      last30Days: 'Last 30 days',
      credsIssued: 'Credentials issued',
      activeLearners: 'Active learners',
      credsConsumed: 'Credits consumed',
      verificationRate: 'Verification rate',
      tenantUtilization: 'TENANT UTILIZATION',
      regionalPilots: 'Regional pilots',
      liveLedger: 'LIVE LEDGER',
      recentActivity: 'Recent activity',
      viewAll: 'View all',
      opportunitySignal: 'OPPORTUNITY SIGNAL',
      oppTitle: 'Canada is pacing ahead of plan',
      oppCopy: 'Northern Polytechnic has 28% more verified outcomes per learner than the portfolio average.',
      openInsight: 'Open insight →',
      caseFrameworks: 'CASE 1.1 FRAMEWORKS',
      compCoverage: 'Competency coverage',
      frameworksSub: 'Three frameworks · bilingual metadata · live alignment',
      footerRef: 'CredBridge reference architecture · v0.1',
      footerBadges: 'Privacy by design • Standards-native • Built for mobility',
      commandCenter: 'Command center',
      tenantStudio: 'Tenant studio',
      liveSandbox: 'Live sandbox',
      credentialWallet: 'Credential wallet',
      unitEconomics: 'Unit economics',
      triggerIssuance: 'Mint Test Badge',
      triggerWebhook: 'Simulate Webhook',
      inspectJwks: 'Inspect JWKS',
    },
    ar: {
      eyebrow: 'مركز الإدارة • بيانات مرجعية قياسية',
      h1: 'الاعتماد الدولي الموحد في واجهة واحدة.',
      sub: 'مجمع أرصدة مشترك للمهارات القابلة للنقل والنتائج الموثوقة والتنقل العالمي.',
      heroContract: 'عقد مشترك لمدة 24 شهرًا',
      heroValue: '5,400$',
      heroCopy: 'مجمع مخصص عبر 3 مشاريع تجريبية دولية',
      creditsRemaining: 'رصيد\nمتبقٍ',
      poolUtilization: 'استخدام المجمع',
      alertThreshold: 'حد التنبيه عند 85%',
      portfolioPulse: 'نبض المحفظة',
      whatsMoving: 'أبرز مؤشرات هذا الشهر',
      last30Days: 'آخر 30 يومًا',
      credsIssued: 'الشهادات الصادرة',
      activeLearners: 'المتعلمون النشطون',
      credsConsumed: 'الأرصدة المستهلكة',
      verificationRate: 'معدل التحقق',
      tenantUtilization: 'استخدام المؤسسات',
      regionalPilots: 'المشاريع الإقليمية',
      liveLedger: 'سجل العمليات المباشر',
      recentActivity: 'النشاط الأخير',
      viewAll: 'عرض الكل',
      opportunitySignal: 'إشارة الفرص',
      oppTitle: 'كندا تتقدم على الخطة الزمنية',
      oppCopy: 'حقق المعهد الكندي نتائج موثقة لكل متعلم بنسبة 28% أعلى من متوسط المحفظة.',
      openInsight: 'عرض الرؤى ←',
      caseFrameworks: 'أطر عمل CASE 1.1',
      compCoverage: 'تغطية الكفاءات',
      frameworksSub: 'ثلاثة أطر · بيانات ثنائية اللغة · موائمة مباشرة',
      footerRef: 'بنية كريد بريدج المرجعية · الإصدار 0.1',
      footerBadges: 'الخصوصية بالتصميم • متوافق مع المعايير • صُمم للتنقل',
      commandCenter: 'مركز القيادة',
      tenantStudio: 'استوديو المؤسسات',
      liveSandbox: 'بيئة التجارب المباشرة',
      credentialWallet: 'محفظة الاعتمادات',
      unitEconomics: 'اقتصاديات الوحدة',
      triggerIssuance: 'إصدار شارة تجريبية',
      triggerWebhook: 'محاكاة إشعار الويب',
      inspectJwks: 'فحص مفاتيح JWKS',
    },
  }[locale];

  const handleMintTest = async () => {
    setIsProcessing(true);
    setSandboxLog('Minting OpenBadge 3.0 / W3C VC with Ed25519 signature...');
    try {
      const res = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: {
          'x-credbridge-actor': 'demo-admin',
          'x-credbridge-tenant': 'gulf-innovation',
          'x-credbridge-role': 'platform-admin',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: 'gulf-innovation',
          learnerId: `learner-${Date.now().toString().slice(-4)}`,
          achievementId: 'ent-val',
          milestoneVersion: '1.0',
          name: 'Customer Discovery & Validation',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSandboxLog(
        `✓ SUCCESS: Issued Credential ID: ${data.credential.id}\n` +
          `Proof Algorithm: ${data.credential.proof.type}\n` +
          `Verification Method: ${data.credential.proof.verificationMethod}\n` +
          `Signature (JWS): ${data.credential.proof.jws.slice(0, 32)}...`
      );

      // Update local state
      setTenantsState((prev) =>
        prev.map((t) => (t.id === 'gulf-innovation' ? { ...t, used: t.used + 1 } : t))
      );
      setEvents((prev) => [
        {
          title: 'Credential issued',
          sub: 'Customer Discovery & Validation',
          tenant: 'Gulf University of Innovation',
          credit: '1 credit',
          time: 'Just now',
          color: 'mint',
        },
        ...prev.slice(0, 3),
      ]);
    } catch (err) {
      setSandboxLog(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateWebhook = async () => {
    setIsProcessing(true);
    setSandboxLog('Simulating partner LMS simulation webhook event (HMAC verified)...');
    try {
      // In reference mode, send directly to API
      const res = await fetch('/api/simulations/webhook', {
        method: 'POST',
        headers: {
          'x-simulation-signature': 'sha256=simulation-default-secret-2026',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          event: 'milestone.completed',
          tenantId: 'emirates-polytechnic',
          learnerId: `sim-${Date.now().toString().slice(-4)}`,
          achievementId: 'wil-comm',
          score: 96.5,
          timestamp: new Date().toISOString(),
          evidenceRef: `ev-sim-${Date.now()}`,
        }),
      });
      const data = await res.json();
      setSandboxLog(
        `✓ WEBHOOK PROCESSED:\n` +
          `Event: ${data.event}\n` +
          `Score: ${data.score}%\n` +
          `Credential ID: ${data.credentialId}`
      );

      setTenantsState((prev) =>
        prev.map((t) => (t.id === 'emirates-polytechnic' ? { ...t, used: t.used + 1 } : t))
      );
      setEvents((prev) => [
        {
          title: 'Credit consumed',
          sub: 'Simulation Milestone (Score: 96.5%)',
          tenant: 'Emirates Applied Polytechnic',
          credit: '1 credit',
          time: 'Just now',
          color: 'blue',
        },
        ...prev.slice(0, 3),
      ]);
    } catch (err) {
      setSandboxLog(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInspectJwks = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/.well-known/jwks.json');
      const data = await res.json();
      setSandboxLog(`✓ PUBLIC JWKS ENDPOINT (/api/.well-known/jwks.json):\n` + JSON.stringify(data, null, 2));
    } catch (err) {
      setSandboxLog(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <aside>
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <strong>credbridge</strong>
            <small>INTERNATIONAL CREDENTIALING</small>
          </div>
        </div>
        <nav>
          <a className="active">
            ⌂ <span>{t.commandCenter}</span>
          </a>
          <a>
            ◫ <span>{t.tenantStudio}</span>
          </a>
          <a
            onClick={() => setSandboxModal(true)}
            style={{ cursor: 'pointer', background: sandboxModal ? '#303540' : undefined }}
          >
            ⌁ <span>{t.liveSandbox}</span>
          </a>
          <a>
            ▣ <span>{t.credentialWallet}</span>
          </a>
          <a>
            ◌ <span>{t.unitEconomics}</span>
          </a>
        </nav>
        <div className="side-foot">
          <div className="avatar">SA</div>
          <div>
            <b>Solutions architect</b>
            <small>Demo workspace</small>
          </div>
          <span>⋮</span>
        </div>
      </aside>

      <section className="content">
        <header>
          <div>
            <p className="eyebrow">
              {t.eyebrow} <span>•</span> ED25519 VERIFIED
            </p>
            <h1>{t.h1}</h1>
            <p className="sub">{t.sub}</p>
          </div>
          <div className="actions">
            <button
              className="lang"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              title="Toggle English / Arabic"
            >
              ◎ {locale.toUpperCase()} <span>⌄</span>
            </button>
            <button className="outline" onClick={() => setSandboxModal(!sandboxModal)}>
              ⌁ {t.liveSandbox}
            </button>
            <button className="avatar big">SA</button>
          </div>
        </header>

        {/* Live Sandbox Control Panel */}
        {sandboxModal && (
          <div
            style={{
              background: '#242832',
              color: '#fff',
              padding: '20px 24px',
              borderRadius: '11px',
              marginBottom: '24px',
              border: '1px solid #3d4250',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <strong>⚡ Live Verification & Simulation Sandbox</strong>
              <button
                onClick={() => setSandboxModal(false)}
                style={{ color: '#a0a4ad', cursor: 'pointer' }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <button
                onClick={handleMintTest}
                disabled={isProcessing}
                style={{
                  background: '#d6f28a',
                  color: '#20242d',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {t.triggerIssuance}
              </button>
              <button
                onClick={handleSimulateWebhook}
                disabled={isProcessing}
                style={{
                  background: '#b8c3ff',
                  color: '#20242d',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {t.triggerWebhook}
              </button>
              <button
                onClick={handleInspectJwks}
                disabled={isProcessing}
                style={{
                  background: '#ffc680',
                  color: '#20242d',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                {t.inspectJwks}
              </button>
            </div>
            {sandboxLog && (
              <pre
                style={{
                  background: '#15171d',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  maxHeight: '180px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  color: '#a0e468',
                }}
              >
                {sandboxLog}
              </pre>
            )}
          </div>
        )}

        <div className="hero">
          <div>
            <p className="eyebrow light">{t.heroContract}</p>
            <div className="hero-value">
              {t.heroValue} <span>USD</span>
            </div>
            <p className="hero-copy">{t.heroCopy}</p>
          </div>
          <div className="pool-ring">
            <div>
              <strong>{fmt(remainingCredits)}</strong>
              <small>
                {t.creditsRemaining.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </small>
            </div>
          </div>
          <div className="hero-metric">
            <span>{t.poolUtilization}</span>
            <strong>{poolUtilization}%</strong>
            <div className="meter">
              <i style={{ width: `${poolUtilization}%` }} />
            </div>
            <small>{t.alertThreshold}</small>
          </div>
        </div>

        <div className="section-head">
          <div>
            <p className="eyebrow">{t.portfolioPulse}</p>
            <h2>{t.whatsMoving}</h2>
          </div>
          <button className="outline">
            {t.last30Days} <span>⌄</span>
          </button>
        </div>

        <div className="stats">
          <article>
            <div className="stat-icon mint">↗</div>
            <div>
              <span>{t.credsIssued}</span>
              <strong>{fmt(2654 + (used - 2654 > 0 ? used - 2654 : 0))}</strong>
              <small className="positive">↑ 18.4% <em>vs last month</em></small>
            </div>
          </article>
          <article>
            <div className="stat-icon blue">◈</div>
            <div>
              <span>{t.activeLearners}</span>
              <strong>2,250</strong>
              <small className="positive">↑ 7.2% <em>vs last month</em></small>
            </div>
          </article>
          <article>
            <div className="stat-icon peach">⌁</div>
            <div>
              <span>{t.credsConsumed}</span>
              <strong>{fmt(used)}</strong>
              <small className="negative">↑ 12.8% <em>vs last month</em></small>
            </div>
          </article>
          <article>
            <div className="stat-icon violet">◌</div>
            <div>
              <span>{t.verificationRate}</span>
              <strong>99.4%</strong>
              <small className="positive">↑ 2.1% <em>vs last month</em></small>
            </div>
          </article>
        </div>

        <div className="grid">
          <section className="card tenants">
            <div className="card-head">
              <div>
                <p className="eyebrow">{t.tenantUtilization}</p>
                <h2>{t.regionalPilots}</h2>
              </div>
              <button className="dots">•••</button>
            </div>
            {tenantsState.map((tn) => (
              <div className="tenant" key={tn.id}>
                <div className="tenant-logo" style={{ background: tn.accent }}>
                  {tn.initials}
                </div>
                <div className="tenant-main">
                  <div className="tenant-title">
                    <strong>{tn.name}</strong>
                    <span>{tn.region}</span>
                  </div>
                  <small>{tn.program}</small>
                  <div className="bar">
                    <i style={{ width: `${(tn.used / tn.allocation) * 100}%` }} />
                  </div>
                </div>
                <div className="tenant-credits">
                  <strong>{fmt(tn.used)}</strong>
                  <small>of {fmt(tn.allocation)} cr</small>
                </div>
                <span className="chev">›</span>
              </div>
            ))}
          </section>

          <section className="card activity">
            <div className="card-head">
              <div>
                <p className="eyebrow">{t.liveLedger}</p>
                <h2>{t.recentActivity}</h2>
              </div>
              <button className="outline small">{t.viewAll}</button>
            </div>
            {events.map((evt, i) => (
              <div className="event" key={i}>
                <div className={`event-dot ${evt.color}`}>✓</div>
                <div>
                  <strong>{evt.title}</strong>
                  <small>
                    {evt.sub} <span>·</span> {evt.tenant}
                  </small>
                </div>
                <div className="event-right">
                  <b>{evt.credit}</b>
                  <small>{evt.time}</small>
                </div>
              </div>
            ))}
          </section>
        </div>

        <section className="bottom-grid">
          <div className="insight">
            <span className="spark">✦</span>
            <div>
              <p className="eyebrow">{t.opportunitySignal}</p>
              <h3>{t.oppTitle}</h3>
              <p>{t.oppCopy}</p>
            </div>
            <button className="outline">{t.openInsight}</button>
          </div>

          <div className="case">
            <div>
              <p className="eyebrow">{t.caseFrameworks}</p>
              <h3>{t.compCoverage}</h3>
              <p>{t.frameworksSub}</p>
            </div>
            <div className="chips">
              {competencies.map((c) => (
                <span key={c.id} title={locale === 'ar' ? c.ar : c.en}>
                  {c.code}: {locale === 'ar' ? c.ar : c.en}
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer>
          <span>{t.footerRef}</span>
          <span>{t.footerBadges}</span>
        </footer>
      </section>
    </main>
  );
}
