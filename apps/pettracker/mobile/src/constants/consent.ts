/**
 * 동의 문서 버전 — 백엔드 레지스트리(backend/app/modules/auth/consent_docs.py)와
 * 반드시 동기 유지. 버전 불일치 시 백엔드가 422를 반환한다 (FR-C2).
 */

import type { ConsentItem } from '@safeway/core-mobile/api/auth';

export const CONSENT_DOC_VERSIONS: Record<string, string> = {
  terms: '2026-06-11',
  privacy: '2026-06-11',
  location: '2026-06-11',
  marketing: '2026-06-11',
  age14: '2026-06-11',
};

export type PtRole = 'pet_owner' | 'walker';

export interface ConsentItemSpec {
  docType: string;
  label: string;
  required: boolean;
  /** PolicyScreen kind — 없으면 열람 링크 미노출 */
  policyKind?: 'terms' | 'privacy';
}

/** 역할별 동의 항목 (FR-M2). walker는 위치정보 동의 필수 (위치정보법). */
export function consentItemsFor(role: PtRole): ConsentItemSpec[] {
  const items: ConsentItemSpec[] = [
    { docType: 'terms', label: '이용약관 동의', required: true, policyKind: 'terms' },
    { docType: 'privacy', label: '개인정보 수집·이용 동의', required: true, policyKind: 'privacy' },
    {
      docType: 'age14',
      label: role === 'walker' ? '만 19세 이상입니다' : '만 14세 이상입니다',
      required: true,
    },
  ];
  if (role === 'walker') {
    items.push({
      docType: 'location',
      label: '위치정보 수집·이용 동의 (산책 중 GPS)',
      required: true,
      policyKind: 'privacy',
    });
  }
  items.push({ docType: 'marketing', label: '마케팅 정보 수신 동의 (선택)', required: false });
  return items;
}

export function toConsentPayload(docTypes: string[]): ConsentItem[] {
  return docTypes.map((docType) => ({
    doc_type: docType,
    doc_version: CONSENT_DOC_VERSIONS[docType],
  }));
}

/** 필수 항목이 전부 체크됐는지 (FR-M2 게이트) */
export function requiredSatisfied(role: PtRole, checked: Set<string>): boolean {
  return consentItemsFor(role)
    .filter((i) => i.required)
    .every((i) => checked.has(i.docType));
}
