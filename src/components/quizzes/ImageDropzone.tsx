import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageDropzoneProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  bucketName?: string;
  label?: string;
}

export function ImageDropzone({
  onImageUploaded,
  currentImageUrl,
  bucketName = "quiz-images",
  label,
}: ImageDropzoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadImage(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadImage(files[0]);
    }
  };

  const uploadImage = async (file: File) => {
    // Vérifier le type de fichier
    if (!file.type.startsWith("image/")) {
      setError(t('imageDropzone.invalidType'));
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('imageDropzone.fileTooLarge'));
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload vers Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      onImageUploaded(publicUrl);
    } catch (err: any) {
      setError(err.message || t('imageDropzone.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label || t('imageDropzone.imageLabel')}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${
            isDragging
              ? "border-emerald-500 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-400 bg-gray-50 hover:bg-gray-100"
          }
          ${uploading ? "opacity-50 cursor-wait" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt={t('imageDropzone.preview')}
              className="w-full max-h-48 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-3">
              {uploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <p className="text-gray-600 font-medium mb-1">
              {uploading ? t('imageDropzone.uploading') : t('imageDropzone.dragHere')}
            </p>
            <p className="text-sm text-gray-500">
              {t('imageDropzone.orClickToSelect')}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {t('imageDropzone.supportedFormats')}
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {currentImageUrl && (
        <p className="mt-1 text-xs text-gray-500 truncate">{currentImageUrl}</p>
      )}
    </div>
  );
}
