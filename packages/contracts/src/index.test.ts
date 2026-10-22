import { describe, expect, it } from 'vitest'; import { tenants, competencies } from './index';
describe('synthetic reference data', () => { it('seeds the international pool tenants', () => { expect(tenants).toHaveLength(3); expect(tenants.reduce((a,t)=>a+t.allocation,0)).toBe(6900); }); it('uses bilingual CASE metadata',()=>expect(competencies.every(c=>c.en && c.ar && c.code)).toBe(true)); });
