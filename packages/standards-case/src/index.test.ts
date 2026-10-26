import { describe, expect, it } from 'vitest';
import { exportCasePackage, exportAllCaseFrameworks, buildCaseItem } from './index';
import { competencies } from '@credbridge/contracts';

describe('standards-case 1.1', () => {
  it('exports a complete CASE 1.1 package with Document, Items, and Associations', () => {
    const pkg = exportCasePackage(competencies);
    expect(pkg.CFDocument.identifier).toBe('credbridge.case.1');
    expect(pkg.CFDocument.language).toBe('en,ar');
    expect(pkg.CFItems).toHaveLength(3);
    expect(pkg.CFAssociations.length).toBeGreaterThan(0);

    const firstItem = pkg.CFItems[0]!;
    expect(firstItem.humanCodingScheme).toBe('WIL.COMM.01');
    expect(firstItem.fullStatementArabic).toBeDefined();

    const assoc = pkg.CFAssociations.find((a) => a.associationType === 'isChildOf');
    expect(assoc).toBeDefined();
    expect(assoc?.destinationNodeURI).toContain('https://credbridge.example/case/item/');
  });

  it('lists all case frameworks for external LMS sync', () => {
    const frameworks = exportAllCaseFrameworks();
    expect(frameworks).toHaveLength(3);
    expect(frameworks[0]?.id).toBe('wil-workplace');
  });

  it('builds an individual CASE item with bilingual statement', () => {
    const item = buildCaseItem(competencies[0]!, 'https://credbridge.example/case/doc');
    expect(item.identifier).toBe('wil-comm');
    expect(item.fullStatement).toBe('Workplace Communication');
    expect(item.fullStatementArabic).toBe('التواصل في مكان العمل');
  });
});
