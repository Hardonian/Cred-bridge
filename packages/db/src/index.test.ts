import {describe,expect,it} from 'vitest'; import {databaseMode} from './index';
describe('reference database',()=>it('is explicit about its deterministic mode',()=>expect(databaseMode).toBe('in-memory-reference')));
