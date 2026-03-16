import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (url: string) => void;
  currentImageUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImageUrl }) => {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(currentImageUrl || '');

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (currentImageUrl) {
      setSelectedImage(currentImageUrl);
    }
  }, [currentImageUrl]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list('');

      if (error) throw error;

      const imageUrls = await Promise.all(
        data.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(file.name);
          
          return {
            name: file.name,
            url: publicUrl
          };
        })
      );

      setImages(imageUrls);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setImages(prev => [...prev, { name: fileName, url: publicUrl }]);
      setSelectedImage(publicUrl);
      onImageSelect(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }
    await uploadImage(file);
  };

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    onImageSelect(url);
  };

  const handleDeleteImage = async (imageName: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const { error } = await supabase.storage
        .from('images')
        .remove([imageName]);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.name !== imageName));
      if (selectedImage === imageName) {
        setSelectedImage('');
        onImageSelect('');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image: ' + (error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Image
        </label>
        <label className="cursor-pointer bg-ocean-600 text-white px-4 py-2 rounded-lg hover:bg-ocean-700 transition-colors inline-flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Upload New
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.name}
            className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${
              selectedImage === image.url
                ? 'border-ocean-600'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => handleImageSelect(image.url)}
            />
            <button
              onClick={() => handleDeleteImage(image.name)}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {images.length === 0 && !uploading && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              No images uploaded yet.<br />
              Upload an image to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;