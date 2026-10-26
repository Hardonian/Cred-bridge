'use client';

import { useState, useMemo } from 'react';
import { tenants as defaultTenants, competencies } from '@credbridge/contracts';

const fmt = (n: number) => n.toLocaleString('en-US');

type TabType = 'command' | 'tenants' | 'sandbox' | 'wallet' | 'economics';

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
  const [activeTab, setActiveTab] = useState<TabType>('command');
  const [tenantsState, setTenantsState] = useState(defaultTenants);
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);

  // Sandbox & Interaction State
  const [sandboxLog, setSandboxLog] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastIssuedId, setLastIssuedId] = useState<string>('cred-demo-2026-001');

  // Tenant Studio Top-Up Modal State
  const [selectedTenantId, setSelectedTenantId] = useState<string>('gulf-innovation');
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  // Unit Economics Interactive Modeler State
  const [cohortSize, setCohortSize] = useState<number>(5000);
  const [attachRate, setAttachRate] = useState<number>(80);
  const [platformFee, setPlatformFee] = useState<number>(35000);
  const [simVolume, setSimVolume] = useState<number>(3);
  const [selectedTier, setSelectedTier] = useState<string>('growth');

  // Wallet State
  const [walletViewMode, setWalletViewMode] = useState<'badge' | 'clr' | 'ler' | 'case'>('badge');
  const [clrData, setClrData] = useState<any>(null);
  const [lerData, setLerData] = useState<any>(null);

  const used = tenantsState.reduce((a, t) => a + t.used, 0);
  const totalPool = tenantsState.reduce((a, t) => a + t.allocation, 0);
  const remainingCredits = totalPool - used;
  const poolUtilization = Math.round((used / totalPool) * 100);

  // Real-time Unit Economics Calculations
  const economics = useMemo(() => {
    const credCount = Math.round((cohortSize * attachRate) / 100);
    const simRuns = credCount * simVolume;
    // Volume tiered rate: standard=0.85, growth=0.65, scale=0.45, enterprise=0.30
    const credCostRate = selectedTier === 'standard' ? 0.85 : selectedTier === 'growth' ? 0.65 : selectedTier === 'scale' ? 0.45 : 0.30;
    const simCostRate = 0.40;

    const credentialGrossCost = credCount * credCostRate;
    const simulationGrossCost = simRuns * simCostRate;
    const totalIssuanceCost = credentialGrossCost + simulationGrossCost;

    // Revenue = institutional platform fee + learner credential charge ($15/cert)
    const learnerCertRevenue = credCount * 15.0;
    const totalGrossRevenue = platformFee + learnerCertRevenue;
    const grossProfit = totalGrossRevenue - totalIssuanceCost;
    const grossMarginPercent = Math.round((grossProfit / totalGrossRevenue) * 100);
    const breakEvenCohort = Math.max(100, Math.round(platformFee / (15.0 - (credCostRate + simVolume * simCostRate))));

    return {
      credCount,
      simRuns,
      credentialGrossCost,
      simulationGrossCost,
      totalIssuanceCost,
      learnerCertRevenue,
      totalGrossRevenue,
      grossProfit,
      grossMarginPercent,
      breakEvenCohort,
    };
  }, [cohortSize, attachRate, platformFee, simVolume, selectedTier]);

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
      triggerIssuance: 'Mint OpenBadge 3.0',
      triggerWebhook: 'Simulate Webhook',
      verifyCredential: 'Verify Cryptographic Proof',
      revokeCredential: 'Revoke (Bitstring 2021)',
      inspectJwks: 'Inspect JWKS',
      inspectDid: 'Inspect did:web',
      topUpAllocation: 'Top-Up Allocation',
      saveQuota: 'Save Quota Adjustment',
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
      triggerIssuance: 'إصدار شارة OpenBadge 3.0',
      triggerWebhook: 'محاكاة إشعار الويب',
      verifyCredential: 'التحقق من الإثبات الرقمي',
      revokeCredential: 'إلغاء الشهادة (Bitstring 2021)',
      inspectJwks: 'فحص مفاتيح JWKS',
      inspectDid: 'فحص معرّف did:web',
      topUpAllocation: 'تعبئة رصيد الحصة',
      saveQuota: 'حفظ تعديل الحصة',
    },
  }[locale];

  // Action Handlers
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
      setLastIssuedId(data.credential.id);
      setSandboxLog(
        `✓ SUCCESS: Issued Credential ID: ${data.credential.id}\n` +
          `Proof Algorithm: ${data.credential.proof.type}\n` +
          `Verification Method: ${data.credential.proof.verificationMethod}\n` +
          `Signature (JWS): ${data.credential.proof.jws.slice(0, 32)}...\n\n` +
          JSON.stringify(data.credential, null, 2)
      );

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
        `✓ WEBHOOK PROCESSED (HMAC SHA-256 Validated):\n` +
          `Event: ${data.event}\n` +
          `Score: ${data.score}%\n` +
          `Issued Credential ID: ${data.credentialId}`
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

  const handleVerifyCredential = async () => {
    setIsProcessing(true);
    setSandboxLog(`Verifying Ed25519 signature proof for ${lastIssuedId}...`);
    try {
      const res = await fetch(`/api/credentials/${encodeURIComponent(lastIssuedId)}/verify`);
      const data = await res.json();
      setSandboxLog(
        `✓ VERIFICATION RESULT:\n` +
          `Valid: ${data.valid}\n` +
          `Key ID: ${data.keyId}\n` +
          `Verified At: ${data.verifiedAt}\n` +
          `Issuer DID: ${data.claims?.issuer}\n` +
          `Recipient: ${data.claims?.credentialSubject?.id}`
      );
    } catch (err) {
      setSandboxLog(`✗ Verification Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevokeCredential = async () => {
    setIsProcessing(true);
    setSandboxLog(`Revoking ${lastIssuedId} and updating W3C StatusList2021 bitstring...`);
    try {
      const res = await fetch(`/api/credentials/${encodeURIComponent(lastIssuedId)}/revoke`, {
        method: 'POST',
        headers: {
          'x-credbridge-actor': 'demo-admin',
          'x-credbridge-tenant': 'gulf-innovation',
          'x-credbridge-role': 'platform-admin',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Manual quality assurance test revocation' }),
      });
      const data = await res.json();
      setSandboxLog(
        `✓ REVOCATION RECORDED:\n` +
          `Revoked: ${data.revoked}\n` +
          `Credential ID: ${data.credentialId}\n` +
          `Timestamp: ${data.timestamp}\n` +
          `Status List Status: Published to bitstring index ${data.credentialId}`
      );
    } catch (err) {
      setSandboxLog(`✗ Revocation Error: ${err instanceof Error ? err.message : String(err)}`);
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

  const handleInspectDid = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/.well-known/did.json');
      const data = await res.json();
      setSandboxLog(`✓ W3C did:web RESOLUTION (/api/.well-known/did.json):\n` + JSON.stringify(data, null, 2));
    } catch (err) {
      setSandboxLog(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadClr = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/learners/learner-101/clr');
      const data = await res.json();
      setClrData(data);
      setWalletViewMode('clr');
    } catch (err) {
      setSandboxLog(`✗ Error loading CLR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadLer = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/learners/learner-101/ler-rs');
      const data = await res.json();
      setLerData(data);
      setWalletViewMode('ler');
    } catch (err) {
      setSandboxLog(`✗ Error loading LER-RS: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyTopUp = () => {
    setTenantsState((prev) =>
      prev.map((t) => (t.id === selectedTenantId ? { ...t, allocation: t.allocation + topUpAmount } : t))
    );
    setShowTopUpModal(false);
    setEvents((prev) => [
      {
        title: 'Quota topped up',
        sub: `+${topUpAmount} Credits Added`,
        tenant: tenantsState.find((t) => t.id === selectedTenantId)?.name || 'Tenant',
        credit: `+${topUpAmount}`,
        time: 'Just now',
        color: 'peach',
      },
      ...prev.slice(0, 3),
    ]);
  };

  return (
    <main className="shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar Navigation */}
      <aside>
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <strong>credbridge</strong>
            <small>INTERNATIONAL CREDENTIALING</small>
          </div>
        </div>
        <nav>
          <a
            className={activeTab === 'command' ? 'active' : ''}
            onClick={() => setActiveTab('command')}
          >
            ⌂ <span>{t.commandCenter}</span>
          </a>
          <a
            className={activeTab === 'tenants' ? 'active' : ''}
            onClick={() => setActiveTab('tenants')}
          >
            ◫ <span>{t.tenantStudio}</span>
          </a>
          <a
            className={activeTab === 'sandbox' ? 'active' : ''}
            onClick={() => setActiveTab('sandbox')}
          >
            ⌁ <span>{t.liveSandbox}</span>
          </a>
          <a
            className={activeTab === 'wallet' ? 'active' : ''}
            onClick={() => setActiveTab('wallet')}
          >
            ▣ <span>{t.credentialWallet}</span>
          </a>
          <a
            className={activeTab === 'economics' ? 'active' : ''}
            onClick={() => setActiveTab('economics')}
          >
            ◌ <span>{t.unitEconomics}</span>
          </a>
        </nav>
        <div className="side-foot">
          <div className="avatar">SA</div>
          <div>
            <b>Solutions architect</b>
            <small>Enterprise Admin</small>
          </div>
          <span>⋮</span>
        </div>
      </aside>

      {/* Main Content Area */}
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
            <button className="outline" onClick={() => setActiveTab('sandbox')}>
              ⌁ {t.liveSandbox}
            </button>
            <button className="avatar big">SA</button>
          </div>
        </header>

        {/* TAB 1: COMMAND CENTER */}
        {activeTab === 'command' && (
          <div>
            <div className="hero">
              <div>
                <small className="light">{t.heroContract}</small>
                <div className="hero-value">
                  {t.heroValue} <span>USD</span>
                </div>
                <div className="hero-copy">{t.heroCopy}</div>
              </div>
              <div className="pool-ring">
                <div>
                  <strong>{fmt(remainingCredits)}</strong>
                  <small>{t.creditsRemaining}</small>
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
                <div className="stat-icon mint">✦</div>
                <div>
                  <span>{t.credsIssued}</span>
                  <strong>
                    {fmt(1842)} <em>+14%</em>
                  </strong>
                  <small className="positive">↑ Pacing +8% vs model</small>
                </div>
              </article>
              <article>
                <div className="stat-icon blue">👥</div>
                <div>
                  <span>{t.activeLearners}</span>
                  <strong>
                    {fmt(1490)} <em>+9%</em>
                  </strong>
                  <small className="positive">↑ Active across 3 pilots</small>
                </div>
              </article>
              <article>
                <div className="stat-icon peach">⚡</div>
                <div>
                  <span>{t.credsConsumed}</span>
                  <strong>
                    {fmt(used)} <em>/ 10k</em>
                  </strong>
                  <small className="positive">● Within allocation</small>
                </div>
              </article>
              <article>
                <div className="stat-icon violet">✓</div>
                <div>
                  <span>{t.verificationRate}</span>
                  <strong>
                    94.2% <em>+2.1%</em>
                  </strong>
                  <small className="positive">↑ Verifiable on-chain</small>
                </div>
              </article>
            </div>

            <div className="grid">
              <div className="card">
                <div className="card-head">
                  <div>
                    <p className="eyebrow">{t.tenantUtilization}</p>
                    <h3>{t.regionalPilots}</h3>
                  </div>
                  <span className="dots">•••</span>
                </div>
                <div>
                  {tenantsState.map((tn) => {
                    const pct = Math.round((tn.used / tn.allocation) * 100);
                    return (
                      <div key={tn.id} className="tenant">
                        <div className="tenant-logo" style={{ background: '#f0f2f5' }}>
                          {tn.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="tenant-main">
                          <div className="tenant-title">
                            <strong>{tn.name}</strong>
                            <span>{tn.program}</span>
                          </div>
                          <small>
                            {fmt(tn.used)} of {fmt(tn.allocation)} credits consumed ({pct}%)
                          </small>
                          <div className="bar">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="tenant-credits">
                          <strong>{fmt(tn.allocation - tn.used)}</strong>
                          <small>available</small>
                        </div>
                        <span className="chev">›</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <p className="eyebrow">{t.liveLedger}</p>
                    <h3>{t.recentActivity}</h3>
                  </div>
                  <button className="outline small" onClick={() => setActiveTab('sandbox')}>
                    {t.viewAll}
                  </button>
                </div>
                <div>
                  {events.map((ev, i) => (
                    <div key={i} className="event">
                      <div className={`event-dot ${ev.color}`}>●</div>
                      <div>
                        <strong>{ev.title}</strong>
                        <small>
                          {ev.sub} <span>•</span> {ev.tenant}
                        </small>
                      </div>
                      <div className="event-right">
                        <b>{ev.credit}</b>
                        <small>{ev.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bottom-grid">
              <div className="insight">
                <span className="spark">⚡</span>
                <div>
                  <p className="eyebrow">{t.opportunitySignal}</p>
                  <h3>{t.oppTitle}</h3>
                  <p>{t.oppCopy}</p>
                </div>
                <button className="outline">{t.openInsight}</button>
              </div>

              <div className="case">
                <p className="eyebrow">{t.caseFrameworks}</p>
                <h3>{t.compCoverage}</h3>
                <p>{t.frameworksSub}</p>
                <div className="chips">
                  {competencies.map((c) => (
                    <span key={c.id}>
                      {locale === 'ar' ? c.ar : c.en} ({c.status})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TENANT STUDIO */}
        {activeTab === 'tenants' && (
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <p className="eyebrow">INSTITUTIONAL PARTNERS • LTI 1.3 ADVANTAGE</p>
                <h2>Tenant Studio & Quota Management</h2>
              </div>
              <button className="btn-accent" onClick={() => setShowTopUpModal(true)}>
                + {t.topUpAllocation}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              {tenantsState.map((tn) => {
                const pct = Math.round((tn.used / tn.allocation) * 100);
                return (
                  <div key={tn.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="tenant-logo" style={{ background: '#e9ecff', color: '#5664d2', width: '42px', height: '42px', fontSize: '12px' }}>
                        {tn.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ font: "10px 'DM Mono'", background: '#ebf8d0', color: '#597a24', padding: '4px 8px', borderRadius: '4px' }}>
                        ACTIVE PILOT
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0' }}>{tn.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '16px' }}>{tn.program}</p>

                    <div style={{ background: '#f8f8f6', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--muted)' }}>Pool Consumption</span>
                        <strong>{pct}% ({tn.used}/{tn.allocation})</strong>
                      </div>
                      <div className="bar" style={{ height: '6px' }}>
                        <i style={{ width: `${pct}%`, background: pct > 80 ? '#d69348' : '#7f91e9' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', display: 'grid', gap: '8px', color: '#666', marginTop: 'auto' }}>
                      <div><b>LMS Integration:</b> Canvas LTI 1.3 Deep Linking</div>
                      <div><b>Cryptographic DID:</b> did:web:credbridge.io:issuers:{tn.id}</div>
                      <div><b>Status List Index:</b> Slot #{tn.allocation * 2}</div>
                    </div>

                    <button
                      className="outline"
                      style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
                      onClick={() => {
                        setSelectedTenantId(tn.id);
                        setShowTopUpModal(true);
                      }}
                    >
                      Adjust Allocation
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 100,
                }}
              >
                <div style={{ background: '#fff', borderRadius: '12px', width: '440px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ marginTop: 0 }}>Adjust Institutional Quota</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '20px' }}>
                    Reserve and inject shared pool credits for international verification pilots.
                  </p>

                  <div className="input-control">
                    <label>Selected Institution</label>
                    <select
                      className="input-field"
                      value={selectedTenantId}
                      onChange={(e) => setSelectedTenantId(e.target.value)}
                    >
                      {tenantsState.map((tn) => (
                        <option key={tn.id} value={tn.id}>
                          {tn.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-control">
                    <label>Additional Credit Top-Up</label>
                    <input
                      type="number"
                      className="input-field"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      step={100}
                      min={100}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button className="outline" onClick={() => setShowTopUpModal(false)}>
                      Cancel
                    </button>
                    <button className="btn-primary" onClick={handleApplyTopUp}>
                      {t.saveQuota}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE SANDBOX */}
        {activeTab === 'sandbox' && (
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <p className="eyebrow">STANDARDS TESTBED • W3C VC & SIMULATIONS</p>
                <h2>Live Verification & Simulation Workbench</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="card">
                <h3>Interactive Actions</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Execute real-time cryptographic signing, webhook simulation, verification, and revocation.
                </p>

                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    onClick={handleMintTest}
                    disabled={isProcessing}
                    className="btn-accent"
                    style={{ justifyContent: 'center' }}
                  >
                    ✦ {t.triggerIssuance}
                  </button>

                  <button
                    onClick={handleSimulateWebhook}
                    disabled={isProcessing}
                    className="btn-primary"
                    style={{ justifyContent: 'center', background: '#302e46' }}
                  >
                    ⚡ {t.triggerWebhook}
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={handleVerifyCredential}
                      disabled={isProcessing}
                      className="outline"
                      style={{ justifyContent: 'center' }}
                    >
                      ✓ {t.verifyCredential}
                    </button>

                    <button
                      onClick={handleRevokeCredential}
                      disabled={isProcessing}
                      className="outline"
                      style={{ justifyContent: 'center', color: '#c2410c' }}
                    >
                      ✕ {t.revokeCredential}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                    <button
                      onClick={handleInspectJwks}
                      disabled={isProcessing}
                      className="outline"
                      style={{ justifyContent: 'center' }}
                    >
                      🔑 {t.inspectJwks}
                    </button>

                    <button
                      onClick={handleInspectDid}
                      disabled={isProcessing}
                      className="outline"
                      style={{ justifyContent: 'center' }}
                    >
                      🌐 {t.inspectDid}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '20px', background: '#f8f8f6', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Target Credential ID</div>
                  <input
                    type="text"
                    className="input-field"
                    value={lastIssuedId}
                    onChange={(e) => setLastIssuedId(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="card" style={{ background: '#191b22', color: '#e2e4ea', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #282c38', paddingBottom: '12px', marginBottom: '12px' }}>
                  <span style={{ font: "600 12px 'DM Mono'", color: '#d6f28a' }}>CONSOLE OUTPUT</span>
                  <button
                    onClick={() => setSandboxLog('')}
                    style={{ font: "11px 'DM Mono'", color: '#888' }}
                  >
                    Clear
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    flex: 1,
                    overflow: 'auto',
                    font: "12px/1.5 'DM Mono', monospace",
                    whiteSpace: 'pre-wrap',
                    color: '#c9d1d9',
                    maxHeight: '400px',
                  }}
                >
                  {sandboxLog || 'Ready for operations. Click an action above to execute verifiable transactions.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREDENTIAL WALLET */}
        {activeTab === 'wallet' && (
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <p className="eyebrow">LEARNER RECORD • OPEN BADGES 3.0 & CLR 2.0</p>
                <h2>Credential Wallet & Skills Transcript</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={walletViewMode === 'badge' ? 'btn-primary' : 'outline'}
                  onClick={() => setWalletViewMode('badge')}
                >
                  Badge Card
                </button>
                <button
                  className={walletViewMode === 'clr' ? 'btn-primary' : 'outline'}
                  onClick={handleLoadClr}
                >
                  CLR 2.0 Tree
                </button>
                <button
                  className={walletViewMode === 'ler' ? 'btn-primary' : 'outline'}
                  onClick={handleLoadLer}
                >
                  LER-RS Skills
                </button>
              </div>
            </div>

            {walletViewMode === 'badge' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                <div className="vc-card">
                  <div className="vc-header">
                    <div className="vc-crest">✦</div>
                    <span className="vc-badge-pill">ED25519 VERIFIED • W3C VC</span>
                  </div>
                  <div className="vc-body">
                    <div className="vc-title">Venture Customer Discovery & Validation</div>
                    <div className="vc-recipient">Awarded to: <strong>Fatima Al-Mansoor</strong> (ID: learner-101)</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '14px 0' }}>
                    <span style={{ font: "10px 'DM Mono'", background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      Customer Discovery
                    </span>
                    <span style={{ font: "10px 'DM Mono'", background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      Hypothesis Testing
                    </span>
                    <span style={{ font: "10px 'DM Mono'", background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      Market Sizing
                    </span>
                  </div>
                  <div className="vc-footer">
                    <span>ISSUER: did:web:credbridge.io:issuers:gulf-innovation</span>
                    <span>SLOT #1842</span>
                  </div>
                </div>

                <div className="card">
                  <h3>Verifiable Credential Metadata</h3>
                  <div style={{ fontSize: '12px', display: 'grid', gap: '10px', marginTop: '14px' }}>
                    <div><b>Context:</b> https://www.w3.org/ns/credentials/v2, https://purl.imsglobal.org/spec/ob/v3p0/context.json</div>
                    <div><b>Cryptographic Suite:</b> Ed25519Signature2020</div>
                    <div><b>Public JWK Discovery:</b> /api/.well-known/jwks.json</div>
                    <div><b>Revocation Bitstring:</b> StatusList2021 (gzip bit-indexed)</div>
                    <div><b>CASE 1.1 Alignment:</b> cb-case-ent-2026 / ent-val-01</div>
                  </div>
                  <button
                    className="outline"
                    style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setSandboxLog(`{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
  ],
  "id": "urn:uuid:cred-demo-2026-001",
  "type": ["VerifiableCredential", "OpenBadgeCredential"],
  "issuer": { "id": "did:web:credbridge.io:issuers:gulf-innovation" },
  "credentialSubject": {
    "id": "urn:uuid:learner-101",
    "achievement": {
      "name": "Venture Customer Discovery & Validation",
      "criteria": { "narrative": "Completed 12 simulated customer discovery interviews" }
    }
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:web:credbridge.io#key-1"
  }
}`);
                      setActiveTab('sandbox');
                    }}
                  >
                    View Raw W3C JSON Payload
                  </button>
                </div>
              </div>
            )}

            {walletViewMode === 'clr' && (
              <div className="card">
                <h3>Comprehensive Learner Record (CLR 2.0 Standard)</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Aggregated multi-course achievement records aligned with 1EdTech CLR 2.0.
                </p>
                <pre style={{ background: '#191b22', color: '#d6f28a', padding: '16px', borderRadius: '8px', overflow: 'auto', font: "12px 'DM Mono'" }}>
                  {JSON.stringify(clrData, null, 2)}
                </pre>
              </div>
            )}

            {walletViewMode === 'ler' && (
              <div className="card">
                <h3>Learning & Employment Record (LER-RS Skills Alignment)</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Normalized skill definitions mapped to ESCO and O*NET taxonomies for global talent mobility.
                </p>
                <pre style={{ background: '#191b22', color: '#b8c3ff', padding: '16px', borderRadius: '8px', overflow: 'auto', font: "12px 'DM Mono'" }}>
                  {JSON.stringify(lerData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: UNIT ECONOMICS & FINANCIAL MODELER */}
        {activeTab === 'economics' && (
          <div>
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <p className="eyebrow">UNIT ECONOMICS • MARGIN & CASH FLOW MODELER</p>
                <h2>Multi-Tenant Cohort Unit Economics & Financial Simulation</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '24px', marginBottom: '24px' }}>
              {/* Controls */}
              <div className="card">
                <h3>Interactive Assumptions</h3>
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '20px' }}>
                  Adjust cohort volume, attach rates, and platform fees to simulate margin break-even curves.
                </p>

                <div className="input-control">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <label>Annual Learner Cohort Size</label>
                    <strong>{fmt(cohortSize)} students</strong>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={500}
                    max={25000}
                    step={500}
                    value={cohortSize}
                    onChange={(e) => setCohortSize(Number(e.target.value))}
                  />
                </div>

                <div className="input-control">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <label>Digital Credential Attach Rate</label>
                    <strong>{attachRate}%</strong>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={20}
                    max={100}
                    step={5}
                    value={attachRate}
                    onChange={(e) => setAttachRate(Number(e.target.value))}
                  />
                </div>

                <div className="input-control">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <label>Base Institutional Platform Fee</label>
                    <strong>${fmt(platformFee)} / yr</strong>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={10000}
                    max={100000}
                    step={5000}
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                  />
                </div>

                <div className="input-control">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <label>Simulation Runs per Learner</label>
                    <strong>{simVolume} simulations</strong>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={1}
                    max={10}
                    step={1}
                    value={simVolume}
                    onChange={(e) => setSimVolume(Number(e.target.value))}
                  />
                </div>

                <div className="input-control">
                  <label>Volume Pricing Tier</label>
                  <select
                    className="input-field"
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                  >
                    <option value="standard">Standard Tier ($0.85 / credit)</option>
                    <option value="growth">Growth Tier ($0.65 / credit)</option>
                    <option value="scale">Scale Tier ($0.45 / credit)</option>
                    <option value="enterprise">Enterprise Tier ($0.30 / credit)</option>
                  </select>
                </div>
              </div>

              {/* Calculated KPI Board */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div className="card" style={{ background: '#302e46', color: '#fff' }}>
                  <small style={{ color: '#bcb9cc' }}>ANNUAL GROSS REVENUE</small>
                  <h2 style={{ fontSize: '28px', margin: '8px 0', color: '#d6f28a' }}>
                    ${fmt(Math.round(economics.totalGrossRevenue))}
                  </h2>
                  <p style={{ color: '#a7a5bc', fontSize: '11px' }}>
                    Includes ${fmt(platformFee)} fee + ${fmt(Math.round(economics.learnerCertRevenue))} cert fees
                  </p>
                </div>

                <div className="card" style={{ background: '#20242d', color: '#fff' }}>
                  <small style={{ color: '#9fa5b1' }}>BLENDED GROSS MARGIN</small>
                  <h2 style={{ fontSize: '28px', margin: '8px 0', color: '#7f91e9' }}>
                    {economics.grossMarginPercent}%
                  </h2>
                  <p style={{ color: '#858c99', fontSize: '11px' }}>
                    Net profit of ${fmt(Math.round(economics.grossProfit))} / year
                  </p>
                </div>

                <div className="card">
                  <small style={{ color: 'var(--muted)' }}>DIRECT ISSUANCE COST</small>
                  <h2 style={{ fontSize: '24px', margin: '6px 0' }}>
                    ${fmt(Math.round(economics.totalIssuanceCost))}
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: '11px' }}>
                    {fmt(economics.credCount)} badges & {fmt(economics.simRuns)} simulations
                  </p>
                </div>

                <div className="card">
                  <small style={{ color: 'var(--muted)' }}>BREAK-EVEN COHORT SIZE</small>
                  <h2 style={{ fontSize: '24px', margin: '6px 0' }}>
                    {fmt(economics.breakEvenCohort)}
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: '11px' }}>
                    Learners required to offset platform overhead
                  </p>
                </div>
              </div>
            </div>

            {/* 12-Month Multi-Tenant Cash Flow Projection Table */}
            <div className="card">
              <div className="card-head" style={{ marginBottom: '14px' }}>
                <div>
                  <p className="eyebrow">12-MONTH CASH FLOW FORECAST</p>
                  <h3>Multi-Tenant Cash Flow & Burn Projection</h3>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Gulf Innovation (UAE)</th>
                    <th>Emirates Polytechnic</th>
                    <th>Northern Poly (Canada)</th>
                    <th>Total Credits Consumed</th>
                    <th>Monthly Cash Collected</th>
                    <th>Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { m: 'M1', g: 120, e: 140, n: 80, rev: 4500, margin: '82%' },
                    { m: 'M2', g: 150, e: 180, n: 95, rev: 5200, margin: '83%' },
                    { m: 'M3', g: 190, e: 220, n: 110, rev: 6100, margin: '84%' },
                    { m: 'M4', g: 240, e: 280, n: 130, rev: 7400, margin: '85%' },
                    { m: 'M5', g: 310, e: 350, n: 160, rev: 8900, margin: '86%' },
                    { m: 'M6', g: 420, e: 440, n: 210, rev: 11200, margin: '87%' },
                    { m: 'M7', g: 480, e: 510, n: 240, rev: 12800, margin: '88%' },
                    { m: 'M8', g: 560, e: 600, n: 280, rev: 14900, margin: '88%' },
                    { m: 'M9', g: 650, e: 690, n: 330, rev: 17200, margin: '89%' },
                    { m: 'M10', g: 760, e: 810, n: 390, rev: 20100, margin: '89%' },
                    { m: 'M11', g: 890, e: 940, n: 460, rev: 23600, margin: '90%' },
                    { m: 'M12', g: 1040, e: 1100, n: 540, rev: 27800, margin: '91%' },
                  ].map((row) => {
                    const totalCreds = row.g + row.e + row.n;
                    return (
                      <tr key={row.m}>
                        <td><strong>{row.m}</strong></td>
                        <td>{fmt(row.g)} credits</td>
                        <td>{fmt(row.e)} credits</td>
                        <td>{fmt(row.n)} credits</td>
                        <td><strong>{fmt(totalCreds)}</strong></td>
                        <td>${fmt(row.rev)}</td>
                        <td><span style={{ color: '#2e7d32', fontWeight: 600 }}>{row.margin}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer>
          <span>{t.footerRef}</span>
          <span>
            {t.footerBadges} <i />
          </span>
        </footer>
      </section>
    </main>
  );
}
