import { competencies, type Competency } from '@credbridge/contracts';

export type CaseAssociationType =
  | 'isChildOf'
  | 'exactMatchOf'
  | 'precedes'
  | 'related'
  | 'replacedBy';

export interface CFDocument {
  identifier: string;
  uri: string;
  creator: string;
  title: string;
  description: string;
  lastChangeDateTime: string;
  officialSourceURL: string;
  publisher: string;
  language: string;
  version: string;
}

export interface CFItem {
  identifier: string;
  uri: string;
  fullStatement: string;
  fullStatementArabic?: string;
  humanCodingScheme: string;
  abbreviatedStatement?: string;
  conceptKeywords?: string[];
  CFDocumentURI: string;
  lastChangeDateTime: string;
  statusStartDate?: string;
}

export interface CFAssociation {
  identifier: string;
  uri: string;
  associationType: CaseAssociationType;
  originNodeURI: string;
  destinationNodeURI: string;
}

export interface CasePackage {
  identifier: string;
  uri: string;
  CFDocument: CFDocument;
  CFItems: CFItem[];
  CFAssociations: CFAssociation[];
}

export function buildCaseItem(c: Competency, documentUri: string): CFItem {
  return {
    identifier: c.id,
    uri: `https://credbridge.example/case/item/${c.id}`,
    fullStatement: c.en,
    fullStatementArabic: c.ar,
    humanCodingScheme: c.code,
    abbreviatedStatement: c.code,
    conceptKeywords: [c.framework, c.status],
    CFDocumentURI: documentUri,
    lastChangeDateTime: new Date().toISOString(),
    statusStartDate: '2026-01-01',
  };
}

export function exportCasePackage(compList: Competency[] = competencies): CasePackage {
  const documentUri = 'https://credbridge.example/case/framework/wil-readiness-v1';
  const doc: CFDocument = {
    identifier: 'credbridge.case.1',
    uri: documentUri,
    creator: 'CredBridge Standards Consortium',
    title: 'CredBridge International Competency Framework 1.1',
    description: 'Bilingual standard competency alignment framework for international student mobility.',
    lastChangeDateTime: new Date().toISOString(),
    officialSourceURL: 'https://credbridge.example/standards/case',
    publisher: 'CredBridge Issuer Network',
    language: 'en,ar',
    version: '1.1.0',
  };

  const items = compList.map((c) => buildCaseItem(c, documentUri));
  const associations: CFAssociation[] = [];

  // Hierarchy associations
  if (items.length > 1) {
    const root = items[0]!;
    for (let i = 1; i < items.length; i++) {
      const child = items[i]!;
      associations.push({
        identifier: `assoc-${i}`,
        uri: `https://credbridge.example/case/assoc/${i}`,
        associationType: 'isChildOf',
        originNodeURI: child.uri,
        destinationNodeURI: root.uri,
      });
      // Precedes association between sequence
      associations.push({
        identifier: `precedes-${i}`,
        uri: `https://credbridge.example/case/assoc/prec-${i}`,
        associationType: 'precedes',
        originNodeURI: items[i - 1]!.uri,
        destinationNodeURI: child.uri,
      });
    }
  }

  return {
    identifier: 'credbridge.synthetic.case.v1',
    uri: 'https://credbridge.example/case/package/v1',
    CFDocument: doc,
    CFItems: items,
    CFAssociations: associations,
  };
}

export function exportAllCaseFrameworks(): Array<{
  id: string;
  title: string;
  packageUrl: string;
  itemsCount: number;
}> {
  return [
    {
      id: 'wil-workplace',
      title: 'Work-Integrated Learning (WIL) Readiness Framework 1.1',
      packageUrl: '/api/case/packages/wil-workplace',
      itemsCount: 1,
    },
    {
      id: 'entrepreneurship-venture',
      title: 'Venture Incubation & Customer Discovery Framework 1.1',
      packageUrl: '/api/case/packages/entrepreneurship-venture',
      itemsCount: 1,
    },
    {
      id: 'digital-analytics',
      title: 'Applied Business & Digital Modeling Framework 1.1',
      packageUrl: '/api/case/packages/digital-analytics',
      itemsCount: 1,
    },
  ];
}
