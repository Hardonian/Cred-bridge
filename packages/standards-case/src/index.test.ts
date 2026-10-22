import {describe,expect,it} from 'vitest';import {competencies} from '@credbridge/contracts';import {exportCasePackage} from './index';
describe('CASE package',()=>it('exports bilingual competency items and associations',()=>{const p=exportCasePackage(competencies);expect(p.CFItems).toHaveLength(3);expect(p.CFAssociations[0]?.associationType).toBe('isChildOf');}));
