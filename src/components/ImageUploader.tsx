import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  file?: File | null;
  isProcessing: boolean;
  id: string;
  disablePasteHandler?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, file = null, isProcessing, id, disablePasteHandler = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }, [file]);

  const handleFile = useCallback((fileToUpload: File | null) => {
    onImageUpload(fileToUpload);
  }, [onImageUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
      if (disablePasteHandler || isProcessing) return;
      
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                  handleFile(file);
                  event.preventDefault(); 
                  break;
              }
          }
      }
  }, [handleFile, isProcessing, disablePasteHandler]);


  useEffect(() => {
    if (isProcessing) {
      // Don't clear preview while processing
      return;
    }
  }, [isProcessing]);

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        onDragEnter={handleDrag}
        onPaste={handlePaste}
        className={`relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${dragActive ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-lavender/50 hover:border-brand-lavender bg-black/20 hover:bg-brand-lilac/10'}`}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="SAT question preview" className="object-contain h-full w-full p-2 rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-10 h-10 mb-3 text-white/60" />
            <p className="mb-2 text-sm text-white/60">
              <span className="font-semibold text-brand-lavender">Click to upload</span>, drag & drop, or paste
            </p>
            <p className="text-xs text-white/40">PNG, JPG, WEBP or from clipboard</p>
          </div>
        )}
        <input id={id} type="file" className="hidden" accept="image/*" onChange={handleChange} disabled={isProcessing} />
        {dragActive && <div className="absolute inset-0" onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
      </label>
    </div>
  );
};

export default ImageUploader;