// FR-M2 동의 게이트 로직 — 순수 함수 검증.

import {
  CONSENT_DOC_VERSIONS,
  consentItemsFor,
  requiredSatisfied,
  toConsentPayload,
} from '../constants/consent';

describe('consentItemsFor', () => {
  it('보호자: terms/privacy/age14 필수 + marketing 선택, location 없음', () => {
    const items = consentItemsFor('pet_owner');
    const required = items.filter((i) => i.required).map((i) => i.docType);
    expect(required.sort()).toEqual(['age14', 'privacy', 'terms']);
    expect(items.find((i) => i.docType === 'marketing')?.required).toBe(false);
    expect(items.some((i) => i.docType === 'location')).toBe(false);
  });

  it('워커: location 동의가 필수에 포함된다 (위치정보법)', () => {
    const items = consentItemsFor('walker');
    const location = items.find((i) => i.docType === 'location');
    expect(location?.required).toBe(true);
  });
});

describe('requiredSatisfied', () => {
  it('필수 항목이 빠지면 false', () => {
    expect(requiredSatisfied('pet_owner', new Set(['terms', 'privacy']))).toBe(false);
    expect(
      requiredSatisfied('walker', new Set(['terms', 'privacy', 'age14'])),
    ).toBe(false); // walker는 location 필요
  });

  it('필수 전부 체크 시 true (선택 미체크 무관)', () => {
    expect(requiredSatisfied('pet_owner', new Set(['terms', 'privacy', 'age14']))).toBe(true);
    expect(
      requiredSatisfied('walker', new Set(['terms', 'privacy', 'age14', 'location'])),
    ).toBe(true);
  });
});

describe('toConsentPayload', () => {
  it('레지스트리 버전을 매핑한다 (FR-C2 — 백엔드 consent_docs.py와 동기)', () => {
    const payload = toConsentPayload(['terms', 'privacy']);
    expect(payload).toEqual([
      { doc_type: 'terms', doc_version: CONSENT_DOC_VERSIONS.terms },
      { doc_type: 'privacy', doc_version: CONSENT_DOC_VERSIONS.privacy },
    ]);
  });
});
