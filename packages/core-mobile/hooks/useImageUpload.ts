/**
 * useImageUpload — Tech Spec FR-3.x (artifacts/specs/2026-04-24-pt-quality-uplift-final-tech-spec.md).
 *
 * 사진 업로드 공용 hook. PT/CC/SafeWay 모두 사용.
 *
 * 흐름:
 *   1. 클라이언트가 entityType + contentType + userId 제공
 *   2. FR-3.3 prefix 패턴 `{app_context}/{entity_type}/{user_id}/{ts}-{rand}.{ext}` 합성
 *   3. POST /storage/upload-url → presigned PUT URL 획득
 *   4. fetch(localUri) → Blob → axios.put(presignedUrl, blob)
 *   5. PUT 200 → downloadUrl 반환
 *
 * Gap (2026-04-27): Tech Spec FR-3.2는 server-generated object_key를 명시하나
 * 현재 백엔드(C-7)는 client-supplied object_key를 받음. 본 hook은 spec prefix를
 * 클라이언트에서 합성해 contract를 맞춤. server-generated 패턴은 V1.1에서 통합 예정
 * (artifacts/gap-notes/2026-04-27-storage-contract-divergence.md 참조).
 *
 * Confirm endpoint(FR-3.5)는 백엔드 미구현. V1은 PUT 2xx 응답을 성공으로 간주하고
 * presigned download_url을 사용. V1.1에서 server HeadObject 검증 도입.
 */

import { useCallback, useState } from 'react';
import axios from 'axios';
import apiClient, { getAppContext } from '../api/client';

export type ImageUploadEntityType =
  | 'walker_profile'
  | 'walk_photo'
  | 'incident_photo'
  | 'pet_photo'
  | 'caregiver_profile'
  | 'child_photo';

export interface ImageUploadParams {
  fileUri: string;
  contentType: string;
  entityType: ImageUploadEntityType;
  userId: string;
}

export interface ImageUploadResult {
  objectKey: string;
  downloadUrl: string;
  provider: string;
}

export interface UseImageUpload {
  upload: (params: ImageUploadParams) => Promise<ImageUploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
};

function inferExtension(contentType: string): string {
  const lower = contentType.toLowerCase();
  if (EXT_BY_MIME[lower]) return EXT_BY_MIME[lower];
  const slash = lower.indexOf('/');
  return slash >= 0 ? lower.slice(slash + 1) : 'bin';
}

function generateObjectKey(
  appContext: string,
  entityType: ImageUploadEntityType,
  userId: string,
  contentType: string,
): string {
  const ext = inferExtension(contentType);
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${appContext}/${entityType}/${userId}/${ts}-${rand}.${ext}`;
}

async function fetchAsBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`local file read failed (status ${res.status})`);
  }
  return await res.blob();
}

export function useImageUpload(): UseImageUpload {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const upload = useCallback(
    async (params: ImageUploadParams): Promise<ImageUploadResult> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const objectKey = generateObjectKey(
          getAppContext(),
          params.entityType,
          params.userId,
          params.contentType,
        );

        const presigned = await apiClient.post('/storage/upload-url', {
          object_key: objectKey,
          content_type: params.contentType,
          expires_in: 600,
        });

        const data = presigned.data ?? {};
        const uploadUrl: string = data.upload_url;
        const downloadUrl: string = data.download_url;
        const provider: string = data.provider ?? 'unknown';
        const serverObjectKey: string = data.object_key ?? objectKey;

        if (!uploadUrl || !downloadUrl) {
          throw new Error('upload-url response missing upload_url/download_url');
        }

        const blob = await fetchAsBlob(params.fileUri);

        await axios.put(uploadUrl, blob, {
          headers: { 'Content-Type': params.contentType },
          onUploadProgress: (e: { loaded: number; total?: number }) => {
            if (e.total && e.total > 0) {
              setProgress(e.loaded / e.total);
            }
          },
        });

        setProgress(1);
        setUploading(false);
        return { objectKey: serverObjectKey, downloadUrl, provider };
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } }; message?: string };
        const msg = err?.response?.data?.detail ?? err?.message ?? '업로드 실패';
        setError(msg);
        setUploading(false);
        throw e;
      }
    },
    [],
  );

  return { upload, uploading, progress, error, reset };
}
