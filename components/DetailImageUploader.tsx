import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, RefreshCw, ZoomIn } from 'lucide-react';
import { CharacterProfile, SceneSetting } from '../types';
import { generateCharacterImage } from '../services/geminiService';

interface DetailImageUploaderProps {
  label: string;
  imageUrl: string | null;
  prompt: string;
  character: CharacterProfile;
  scene: SceneSetting;
  context: 'Clothing' | 'Props';
  onImageUpdate: (base64: string) => void;
  onPromptChange: (prompt: string) => void;
  onImageClick: (url: string) => void;
}

export const DetailImageUploader: React.FC<DetailImageUploaderProps> = ({ 
    label, 
    imageUrl, 
    prompt,
    character,
    scene,
    context,
    onImageUpdate,
    onPromptChange,
    onImageClick,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                onImageUpdate(imageUrl); // Fallback to original
                return;
            }

            const sourceWidth = img.width;
            const sourceHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;
            const cropSize = Math.min(sourceWidth, sourceHeight);

            // Calculate starting X and Y for center crop
            if (sourceWidth > sourceHeight) {
                sourceX = (sourceWidth - sourceHeight) / 2;
            } else {
                sourceY = (sourceHeight - sourceWidth) / 2;
            }
            
            canvas.width = cropSize;
            canvas.height = cropSize;

            ctx.drawImage(
                img,
                sourceX,
                sourceY,
                cropSize,
                cropSize,
                0,
                0,
                cropSize,
                cropSize
            );

            const croppedImageUrl = canvas.toDataURL(file.type);
            onImageUpdate(croppedImageUrl);
        };
        img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt) {
      alert("生成前请输入描述词。");
      return;
    }
    setLoading(true);
    try {
      const itemPrompt = `Generate a concept art image of a single ${context === 'Clothing' ? 'piece of clothing/accessory' : 'prop/weapon'} on a neutral, isolated background. Item details: "${prompt}"`;
      const base64 = await generateCharacterImage(character, scene, itemPrompt, [], "1:1");
      onImageUpdate(base64);
    } catch (error) {
      console.error(error);
      alert("生成失败，请检查 API Key 并重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label} 参考图
        </span>
        <div className="flex items-center gap-2">
            <button
                onClick={handleUploadClick}
                title="上传本地图片"
                className="text-xs flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
            >
                <Upload className="w-3 h-3" />
                上传
            </button>
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                生成
            </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        className="relative group w-full h-28 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg overflow-hidden flex items-center justify-center"
      >
        {imageUrl ? (
          <button type="button" onClick={() => onImageClick(imageUrl)} className="w-full h-full block">
            <img src={imageUrl} alt={`${label} reference`} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <ZoomIn className="w-8 h-8 text-white" />
            </div>
          </button>
        ) : (
          <div className="text-center p-2 text-slate-500">
            <ImageIcon className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">{loading ? "正在生成..." : "上传或生成图片"}</p>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            生成描述词
        </label>
        <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-16"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={`描述${label}的细节...`}
        />
      </div>
    </div>
  );
};