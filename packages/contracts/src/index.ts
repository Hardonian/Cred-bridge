export type Locale = 'en' | 'ar';
export type Tenant = { id: string; name: string; region: string; program: string; learners: number; allocation: number; used: number; accent: string; initials: string };
export type LedgerEntry = { id: string; tenantId: string; type: 'RESERVED' | 'CONSUMED' | 'RELEASED'; credits: number; reference: string; createdAt: string };
export type Competency = { id: string; code: string; en: string; ar: string; framework: string; status: 'Mapped' | 'Evidence ready' | 'Verified' };
export const tenants: Tenant[] = [
  { id:'gulf-innovation', name:'Gulf University of Innovation', region:'Middle East', program:'Entrepreneurship & Innovation', learners:1200, allocation:3600, used:1438, accent:'#d6f28a', initials:'GUI' },
  { id:'emirates-polytechnic', name:'Emirates Applied Polytechnic', region:'Middle East', program:'WIL & Apprenticeship Readiness', learners:450, allocation:1500, used:704, accent:'#b8c3ff', initials:'EAP' },
  { id:'northern-polytechnic', name:'Northern Polytechnic Institute', region:'Canada', program:'BComm / Applied IT Co-op', learners:600, allocation:1800, used:512, accent:'#ffc680', initials:'NPI' }
];
export const competencies: Competency[] = [
  { id:'wil-comm', code:'WIL.COMM.01', en:'Workplace Communication', ar:'التواصل في مكان العمل', framework:'WIL Workplace Readiness', status:'Verified' },
  { id:'ent-val', code:'ENT.VAL.02', en:'Customer Discovery & Evidence Synthesis', ar:'اكتشاف العملاء وتحليل الأدلة', framework:'Entrepreneurship & Venture Validation', status:'Evidence ready' },
  { id:'dig-data', code:'DIG.DATA.03', en:'Applied Spreadsheet & Analytical Modeling', ar:'النمذجة التحليلية وجداول البيانات', framework:'Applied Digital & Business Analytics', status:'Mapped' }
];
