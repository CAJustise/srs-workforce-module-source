import React, { useEffect, useMemo, useState } from 'react';
import { Upload, X, Image as ImageIcon, Copy, Check, Filter, Edit2, RefreshCw, KeyRound, Save } from 'lucide-react';
import {
  type GithubImageCategory,
  type GithubImageItem,
  deleteGithubImage,
  githubImageConfig,
  loadGithubImageLibrary,
  updateGithubImageMetadata,
  uploadGithubImages,
} from '../../lib/githubImageLibrary';

const TOKEN_STORAGE_KEY = 'spoonbill.github.token';

const ImageManager: React.FC = () => {
  const [images, setImages] = useState<GithubImageItem[]>([]);
  const [categories, setCategories] = useState<GithubImageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [isMetadataFormOpen, setIsMetadataFormOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GithubImageItem | null>(null);
  const [githubToken, setGithubToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  });
  const [tokenInput, setTokenInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  });

  const fetchData = async () => {
    try {
      setSyncing(true);
      const library = await loadGithubImageLibrary(githubToken || undefined);
      setImages(library.images);
      setCategories(library.categories);

      if (!uploadCategory && library.categories.length > 0) {
        setUploadCategory(library.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching GitHub image library:', error);
      alert('Error fetching GitHub image library: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubToken]);

  const saveToken = () => {
    const trimmed = tokenInput.trim();

    if (typeof window !== 'undefined') {
      if (trimmed) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }

    setGithubToken(trimmed);
  };

  const clearToken = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    setTokenInput('');
    setGithubToken('');
  };

  const uploadImages = async (files: FileList) => {
    if (!githubToken) {
      alert('Save a GitHub token first to enable uploads.');
      return;
    }

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress({});

      const maxSingleFileSize = 25 * 1024 * 1024; // 25MB each
      const oversized = fileArray.filter((file) => file.size > maxSingleFileSize);
      if (oversized.length > 0) {
        alert(`These files exceed 25MB and cannot be uploaded:\n${oversized.map((file) => file.name).join('\n')}`);
        return;
      }

      const selectedUploadCategory = categories.find((category) => category.id === uploadCategory) || null;

      await uploadGithubImages(
        fileArray,
        selectedUploadCategory?.id || null,
        selectedUploadCategory?.name || null,
        githubToken,
        (fileName, percent) => {
          setUploadProgress((previous) => ({
            ...previous,
            [fileName]: percent,
          }));
        },
      );

      await fetchData();
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images: ' + (error as Error).message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    await uploadImages(event.target.files);
    event.target.value = '';
  };

  const handleDeleteImage = async (image: GithubImageItem) => {
    if (!githubToken) {
      alert('Save a GitHub token first to delete images.');
      return;
    }

    if (!confirm('Are you sure you want to delete this image from GitHub?')) return;

    try {
      await deleteGithubImage(image, githubToken);
      await fetchData();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image: ' + (error as Error).message);
    }
  };

  const handleUpdateMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!githubToken) {
      alert('Save a GitHub token first to edit metadata.');
      return;
    }

    if (!editingImage) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const categoryId = (formData.get('category_id') as string) || '';
    const category = categories.find((item) => item.id === categoryId);

    try {
      await updateGithubImageMetadata(
        editingImage.id,
        {
          display_name: (formData.get('display_name') as string) || editingImage.display_name,
          category_id: categoryId || null,
          description: ((formData.get('description') as string) || '').trim() || null,
        },
        githubToken,
        category?.name,
      );

      await fetchData();
      setIsMetadataFormOpen(false);
      setEditingImage(null);
    } catch (error) {
      console.error('Error updating metadata:', error);
      alert('Error updating metadata: ' + (error as Error).message);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const filteredImages = selectedCategory
    ? images.filter((image) => image.category_id === selectedCategory)
    : images;

  const selectedCategoryLabel = useMemo(
    () => categories.find((category) => category.id === selectedCategory)?.name || 'All Categories',
    [categories, selectedCategory],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">Image Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              GitHub source: <span className="font-medium">{githubImageConfig.owner}/{githubImageConfig.repo}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchData()}
              disabled={syncing}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <label className="cursor-pointer bg-ocean-600 text-white px-6 py-3 rounded-lg hover:bg-ocean-700 transition-colors inline-flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Images
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <KeyRound className="h-4 w-4" />
            <span>GitHub token is required for upload/edit/delete (read-only browsing works without it).</span>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="GitHub token (repo contents: read/write)"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <button
              onClick={saveToken}
              className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 inline-flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Token
            </button>
            <button
              onClick={clearToken}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Token status: {githubToken ? 'Saved locally in this browser' : 'Not saved'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-gray-500" />
            <select
              value={uploadCategory}
              onChange={(event) => setUploadCategory(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-ocean-500 focus:border-ocean-500"
            >
              <option value="">Upload to: Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  Upload to: {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uploading to GitHub...</h3>
            <div className="space-y-4">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{filename}</span>
                    <span className="text-gray-900">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ocean-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredImages.length} image(s) in <span className="font-medium">{selectedCategoryLabel}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden group"
            >
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.display_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => void handleDeleteImage(image)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="font-medium text-gray-900 truncate" title={image.display_name}>
                    {image.display_name}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingImage(image);
                      setIsMetadataFormOpen(true);
                    }}
                    className="text-ocean-600 hover:text-ocean-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                {image.category && (
                  <span className="inline-block px-2 py-1 text-xs font-medium text-ocean-600 bg-ocean-50 rounded-full mb-2">
                    {image.category.name}
                  </span>
                )}

                {image.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {image.description}
                  </p>
                )}

                <button
                  onClick={() => void copyToClipboard(image.url)}
                  className="flex items-center text-gray-500 hover:text-ocean-600 transition-colors text-sm"
                >
                  {copiedUrl === image.url ? (
                    <Check className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  Copy URL
                </button>
              </div>
            </div>
          ))}

          {filteredImages.length === 0 && !uploading && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-lg">
              <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                No images found.{selectedCategory ? ' Try selecting a different category.' : ' Upload an image to get started.'}
              </p>
            </div>
          )}
        </div>

        {isMetadataFormOpen && editingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
                Edit Image Details
              </h2>
              <form onSubmit={handleUpdateMetadata} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    defaultValue={editingImage.display_name}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category_id"
                    defaultValue={editingImage.category_id || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingImage.description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMetadataFormOpen(false);
                      setEditingImage(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageManager;
