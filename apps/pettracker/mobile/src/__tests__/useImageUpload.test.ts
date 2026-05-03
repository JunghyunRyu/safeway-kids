// C-9 useImageUpload — verify presigned-then-PUT flow + error handling.
// Subpath import bypasses the @safeway/core-mobile root mock from setup.ts.

import { renderHook, act } from '@testing-library/react-native';
import axios from 'axios';
import { useImageUpload } from '@safeway/core-mobile/hooks/useImageUpload';

// setup.ts mocks 'axios' globally — both apiClient.post (axios.create instance)
// and axios.put share the same underlying inst.* mocks.
const axiosMock = axios as unknown as {
  post: jest.Mock;
  put: jest.Mock;
};

describe('useImageUpload', () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.put.mockReset();

    // global.fetch reads the local file uri into a Blob
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: async () => ({ size: 100, type: 'image/jpeg' } as unknown as Blob),
    });
  });

  it('POSTs /storage/upload-url with FR-3.3 prefix then PUTs to presigned URL', async () => {
    axiosMock.post.mockResolvedValueOnce({
      data: {
        object_key: 'pettracker/walker_profile/u-walker-1/abc.jpg',
        upload_url: 'https://s3.example.com/presigned-put',
        download_url: 'https://s3.example.com/presigned-get',
        expires_in: 600,
        provider: 'local',
      },
    });
    axiosMock.put.mockResolvedValueOnce({ status: 200 });

    const { result } = renderHook(() => useImageUpload());

    let res: { objectKey: string; downloadUrl: string; provider: string } | undefined;
    await act(async () => {
      res = await result.current.upload({
        fileUri: 'file:///tmp/photo.jpg',
        contentType: 'image/jpeg',
        entityType: 'walker_profile',
        userId: 'u-walker-1',
      });
    });

    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    const [postPath, postBody] = axiosMock.post.mock.calls[0];
    expect(postPath).toBe('/storage/upload-url');
    expect(postBody.content_type).toBe('image/jpeg');
    expect(postBody.expires_in).toBe(600);
    // FR-3.3 prefix: {app_context}/{entity_type}/{user_id}/{ts}-{rand}.{ext}
    expect(postBody.object_key).toMatch(
      /^pettracker\/walker_profile\/u-walker-1\/[a-z0-9]+-[a-z0-9]+\.jpg$/,
    );

    expect(axiosMock.put).toHaveBeenCalledTimes(1);
    const [putUrl, , putConfig] = axiosMock.put.mock.calls[0];
    expect(putUrl).toBe('https://s3.example.com/presigned-put');
    expect(putConfig.headers['Content-Type']).toBe('image/jpeg');

    expect(res).toEqual({
      objectKey: 'pettracker/walker_profile/u-walker-1/abc.jpg',
      downloadUrl: 'https://s3.example.com/presigned-get',
      provider: 'local',
    });
    expect(result.current.uploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('captures backend detail on failure and rethrows', async () => {
    axiosMock.post.mockRejectedValueOnce({
      response: { data: { detail: 'storage unavailable' } },
    });

    const { result } = renderHook(() => useImageUpload());

    await act(async () => {
      await expect(
        result.current.upload({
          fileUri: 'file:///tmp/photo.jpg',
          contentType: 'image/jpeg',
          entityType: 'walk_photo',
          userId: 'u-walker-1',
        }),
      ).rejects.toBeDefined();
    });

    expect(result.current.error).toBe('storage unavailable');
    expect(result.current.uploading).toBe(false);
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it('infers extension from content type for png', async () => {
    axiosMock.post.mockResolvedValueOnce({
      data: {
        object_key: 'pettracker/walk_photo/u-1/x.png',
        upload_url: 'https://s3/put',
        download_url: 'https://s3/get',
        expires_in: 600,
        provider: 'local',
      },
    });
    axiosMock.put.mockResolvedValueOnce({ status: 200 });

    const { result } = renderHook(() => useImageUpload());
    await act(async () => {
      await result.current.upload({
        fileUri: 'file:///tmp/photo.png',
        contentType: 'image/png',
        entityType: 'walk_photo',
        userId: 'u-1',
      });
    });

    const objectKey = axiosMock.post.mock.calls[0][1].object_key;
    expect(objectKey).toMatch(/\.png$/);
  });
});
