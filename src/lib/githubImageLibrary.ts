export interface GithubImageCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface GithubImageRecord {
  id: string;
  path: string;
  display_name: string;
  category_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GithubImageItem extends GithubImageRecord {
  url: string;
  category: GithubImageCategory | null;
}

interface GithubImageManifest {
  version: number;
  updated_at: string;
  categories: GithubImageCategory[];
  images: GithubImageRecord[];
}

interface GithubTreeResponse {
  tree: Array<{
    path: string;
    type: string;
  }>;
}

interface GithubContentResponse {
  sha: string;
  content?: string;
}

interface ManifestWithSha {
  manifest: GithubImageManifest;
  sha?: string;
}

const OWNER = 'CAJustise';
const REPO = 'the-spoonbill';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;

const MANIFEST_REPO_PATH = 'public/images/metadata.json';
const LIBRARY_PREFIX = 'public/images/library/';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const nowIso = () => new Date().toISOString();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized';

const toTitle = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getExtension = (filePath: string) => {
  const parts = filePath.toLowerCase().split('.');
  if (parts.length < 2) return '';
  return `.${parts.pop()}`;
};

const makeImageUrl = (repoPath: string) => {
  const encodedPath = repoPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${RAW_BASE}/${encodedPath}`;
};

const defaultManifest = (): GithubImageManifest => ({
  version: 1,
  updated_at: nowIso(),
  categories: [],
  images: [],
});

const normalizeManifest = (value: unknown): GithubImageManifest => {
  if (!value || typeof value !== 'object') {
    return defaultManifest();
  }

  const candidate = value as Partial<GithubImageManifest>;
  const categories = Array.isArray(candidate.categories)
    ? candidate.categories
        .filter((item): item is GithubImageCategory => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string'))
        .map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? null,
        }))
    : [];

  const images = Array.isArray(candidate.images)
    ? candidate.images
        .filter((item): item is GithubImageRecord => Boolean(item && typeof item.path === 'string'))
        .map((item) => ({
          id: item.id || `img_${slugify(item.path).slice(0, 40)}`,
          path: item.path,
          display_name: item.display_name || toTitle(item.path.split('/').pop() || 'image'),
          category_id: item.category_id ?? null,
          description: item.description ?? null,
          created_at: item.created_at || nowIso(),
          updated_at: item.updated_at || nowIso(),
        }))
    : [];

  return {
    version: candidate.version ?? 1,
    updated_at: candidate.updated_at || nowIso(),
    categories,
    images,
  };
};

const requestGithub = async <T>(
  endpoint: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> => {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('X-GitHub-Api-Version', '2022-11-28');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `GitHub API error (${response.status})`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

const toApiContentPath = (repoPath: string) =>
  repoPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const encodeUtf8Base64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const chunk = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }

  return btoa(binary);
};

const decodeUtf8Base64 = (base64Value: string) => {
  const compact = base64Value.replace(/\n/g, '');
  const binary = atob(compact);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }

  return btoa(binary);
};

const readManifest = async (): Promise<GithubImageManifest> => {
  try {
    const response = await fetch(`${RAW_BASE}/${MANIFEST_REPO_PATH}?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return defaultManifest();
    }

    const payload = await response.json();
    return normalizeManifest(payload);
  } catch {
    return defaultManifest();
  }
};

const readManifestWithSha = async (token: string): Promise<ManifestWithSha> => {
  try {
    const encodedPath = toApiContentPath(MANIFEST_REPO_PATH);
    const data = await requestGithub<GithubContentResponse>(`/contents/${encodedPath}?ref=${encodeURIComponent(BRANCH)}`, {}, token);

    if (!data.content) {
      return {
        manifest: defaultManifest(),
        sha: data.sha,
      };
    }

    const decoded = decodeUtf8Base64(data.content);
    const parsed = JSON.parse(decoded);

    return {
      manifest: normalizeManifest(parsed),
      sha: data.sha,
    };
  } catch {
    return {
      manifest: defaultManifest(),
    };
  }
};

const writeManifest = async (token: string, manifest: GithubImageManifest, sha?: string, message?: string) => {
  const encodedPath = toApiContentPath(MANIFEST_REPO_PATH);
  const body: Record<string, string> = {
    message: message || 'Update image metadata',
    content: encodeUtf8Base64(JSON.stringify(manifest, null, 2)),
    branch: BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  await requestGithub(`/contents/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  }, token);
};

const ensureToken = (token: string) => {
  if (!token || !token.trim()) {
    throw new Error('A GitHub token is required for uploads and edits.');
  }
};

const inferCategory = (repoPath: string) => {
  if (!repoPath.startsWith(LIBRARY_PREFIX)) {
    return {
      id: 'uncategorized',
      name: 'Uncategorized',
    };
  }

  const relative = repoPath.slice(LIBRARY_PREFIX.length);
  const firstSegment = relative.split('/')[0] || 'uncategorized';

  return {
    id: slugify(firstSegment),
    name: toTitle(firstSegment),
  };
};

const inferDisplayName = (repoPath: string) => {
  const filename = repoPath.split('/').pop() || 'image';
  const withoutExtension = filename.replace(/\.[^.]+$/, '');
  return toTitle(withoutExtension);
};

const listRepoImagePaths = async (token?: string) => {
  const payload = await requestGithub<GithubTreeResponse>(`/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`, {}, token);

  return (payload.tree || [])
    .filter((item) => item.type === 'blob')
    .filter((item) => item.path.startsWith(LIBRARY_PREFIX))
    .map((item) => item.path)
    .filter((path) => IMAGE_EXTENSIONS.has(getExtension(path)));
};

const mergeManifestAndRepo = (manifest: GithubImageManifest, repoPaths: string[]): { categories: GithubImageCategory[]; images: GithubImageItem[] } => {
  const manifestByPath = new Map<string, GithubImageRecord>();
  manifest.images.forEach((item) => {
    manifestByPath.set(item.path, item);
  });

  const categoryMap = new Map<string, GithubImageCategory>();
  manifest.categories.forEach((category) => {
    categoryMap.set(category.id, category);
  });

  const records = repoPaths
    .sort((left, right) => left.localeCompare(right))
    .map((repoPath) => {
      const existing = manifestByPath.get(repoPath);
      const inferredCategory = inferCategory(repoPath);

      if (!categoryMap.has(inferredCategory.id)) {
        categoryMap.set(inferredCategory.id, {
          id: inferredCategory.id,
          name: inferredCategory.name,
          description: null,
        });
      }

      if (existing) {
        return existing;
      }

      return {
        id: `img_${slugify(repoPath).slice(0, 40)}`,
        path: repoPath,
        display_name: inferDisplayName(repoPath),
        category_id: inferredCategory.id,
        description: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      } satisfies GithubImageRecord;
    });

  const categories = Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const images = records
    .map((record) => ({
      ...record,
      url: makeImageUrl(record.path),
      category: record.category_id ? categoryById.get(record.category_id) || null : null,
    }))
    .sort((left, right) => left.display_name.localeCompare(right.display_name));

  return { categories, images };
};

export const loadGithubImageLibrary = async (token?: string) => {
  const manifest = await readManifest();

  try {
    const repoPaths = await listRepoImagePaths(token);
    return mergeManifestAndRepo(manifest, repoPaths);
  } catch {
    const manifestPaths = manifest.images
      .map((item) => item.path)
      .filter((path) => path.startsWith(LIBRARY_PREFIX))
      .filter((path) => IMAGE_EXTENSIONS.has(getExtension(path)));

    return mergeManifestAndRepo(manifest, manifestPaths);
  }
};

const ensureCategoryInManifest = (manifest: GithubImageManifest, categoryId: string | null, categoryName: string | null) => {
  if (!categoryId) return;

  const id = slugify(categoryId);
  const exists = manifest.categories.some((category) => category.id === id);
  if (exists) return;

  manifest.categories.push({
    id,
    name: categoryName?.trim() || toTitle(id),
    description: null,
  });
};

const putBinaryFile = async (repoPath: string, base64Content: string, token: string, message: string) => {
  const encodedPath = toApiContentPath(repoPath);

  await requestGithub(`/contents/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: BRANCH,
    }),
  }, token);
};

export const uploadGithubImages = async (
  files: File[],
  categoryId: string | null,
  categoryName: string | null,
  token: string,
  onProgress?: (fileName: string, percent: number) => void,
) => {
  ensureToken(token);

  const { manifest, sha } = await readManifestWithSha(token);
  const createdImages: GithubImageRecord[] = [];
  const safeCategoryId = categoryId ? slugify(categoryId) : 'uncategorized';
  const finalCategoryId = categoryId ? slugify(categoryId) : null;

  ensureCategoryInManifest(manifest, finalCategoryId, categoryName);

  for (const file of files) {
    onProgress?.(file.name, 5);

    const extension = getExtension(file.name) || '.png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const safeName = slugify(baseName).slice(0, 64);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}${extension}`;
    const repoPath = `${LIBRARY_PREFIX}${safeCategoryId}/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const content = arrayBufferToBase64(arrayBuffer);

    await putBinaryFile(repoPath, content, token, `Upload image: ${file.name}`);

    const record: GithubImageRecord = {
      id: `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      path: repoPath,
      display_name: baseName,
      category_id: finalCategoryId,
      description: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    createdImages.push(record);
    manifest.images.push(record);

    onProgress?.(file.name, 90);
  }

  manifest.updated_at = nowIso();
  await writeManifest(token, manifest, sha, `Update image metadata for ${files.length} upload(s)`);

  createdImages.forEach((record) => {
    onProgress?.(record.display_name, 100);
  });

  return createdImages;
};

export const updateGithubImageMetadata = async (
  imageId: string,
  updates: {
    display_name: string;
    category_id: string | null;
    description: string | null;
  },
  token: string,
  categoryName?: string | null,
) => {
  ensureToken(token);

  const { manifest, sha } = await readManifestWithSha(token);
  const nextCategoryId = updates.category_id ? slugify(updates.category_id) : null;

  ensureCategoryInManifest(manifest, nextCategoryId, categoryName || null);

  const index = manifest.images.findIndex((image) => image.id === imageId);
  if (index < 0) {
    throw new Error('Image metadata record was not found.');
  }

  manifest.images[index] = {
    ...manifest.images[index],
    display_name: updates.display_name,
    category_id: nextCategoryId,
    description: updates.description,
    updated_at: nowIso(),
  };

  manifest.updated_at = nowIso();
  await writeManifest(token, manifest, sha, `Update metadata: ${updates.display_name}`);
};

const readFileSha = async (repoPath: string, token: string) => {
  const encodedPath = toApiContentPath(repoPath);
  const payload = await requestGithub<GithubContentResponse>(`/contents/${encodedPath}?ref=${encodeURIComponent(BRANCH)}`, {}, token);
  return payload.sha;
};

export const deleteGithubImage = async (image: GithubImageRecord, token: string) => {
  ensureToken(token);

  const fileSha = await readFileSha(image.path, token);
  const encodedPath = toApiContentPath(image.path);

  await requestGithub(`/contents/${encodedPath}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `Delete image: ${image.display_name}`,
      sha: fileSha,
      branch: BRANCH,
    }),
  }, token);

  const { manifest, sha } = await readManifestWithSha(token);
  manifest.images = manifest.images.filter((record) => record.id !== image.id && record.path !== image.path);
  manifest.updated_at = nowIso();

  await writeManifest(token, manifest, sha, `Remove metadata: ${image.display_name}`);
};

export const githubImageConfig = {
  owner: OWNER,
  repo: REPO,
  branch: BRANCH,
  manifestPath: MANIFEST_REPO_PATH,
};
