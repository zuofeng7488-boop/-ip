import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] "
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img 
          src={imageUrl} 
          alt="Fullscreen Preview" 
          className="block max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Close image preview"
      >
        <X className="w-8 h-8" />
      </button>
    </div>
  );
};

// Add fade-in animation keyframes to index.html or a global CSS file if you have one.
// For simplicity here, it's assumed tailwind.config.js is extended or it's in a style tag.
// We can add it directly in index.html for this setup.
