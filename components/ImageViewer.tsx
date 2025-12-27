import React, { useState, useRef } from 'react';
import { ViewType, CharacterProfile, SceneSetting, ReferenceImage } from '../types';
import { generateCharacterImage } from '../services/geminiService';
import { Loader2, RefreshCw, Image as ImageIcon, Upload, Edit, CheckSquare, Square, Brush, Download } from 'lucide-react';

interface ImageViewerProps {
  view: ViewType;
  character: CharacterProfile;
  scene: SceneSetting;
  prompt: string;
  apiKey: string;
  selectedModel: string;
  fullBodyStyle?: string;
  onImageUpdate: (view: ViewType, base64: string) => void;
  onPromptChange: (view: ViewType, prompt: string) => void;
  onImageClick: (view: ViewType, url: string) => void;
  onStyleChange?: (style: string) => void;
}

const viewNames: Record<ViewType, string> = {
  Front: '面部正面视图',
  Side: '面部侧面视图',
  Full: '全身'
};

const styleOptions = ['电影写实', '卡通动漫', '3D渲染', '水墨动画'];

interface RefSelection {
    face: boolean;
    clothing: boolean;
    prop: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ view, character, scene, prompt, apiKey, selectedModel, fullBodyStyle, onImageUpdate, onPromptChange, onImageClick, onStyleChange }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrl = scene.generatedImages[view.toLowerCase() as keyof typeof scene.generatedImages];
  const [selectedRefs, setSelectedRefs] = useState<RefSelection>({ face: false, clothing: false, prop: false });

  const handleGenerate = async () => {
    if (view === 'Full' && !prompt) {
      alert("生成全身视图前请输入描述词。");
      return;
    }
    
    setLoading(true);

    try {
        let references: ReferenceImage[] = [];
        let mainPrompt = prompt;
        let aspectRatio: "1:1" | "9:16" = view === 'Full' ? '9:16' : '1:1';

        if (view === 'Full') {
            if (selectedRefs.face && scene.generatedImages.front) {
                references.push({ type: 'Face', data: scene.generatedImages.front });
            }
            if (selectedRefs.clothing && scene.clothingImage) {
                references.push({ type: 'Clothing', data: scene.clothingImage });
            }
            if (selectedRefs.prop && scene.propsImage) {
                references.push({ type: 'Prop', data: scene.propsImage });
            }
        } else { // Front or Side
            const referenceImage = scene.generatedImages.full;
            if (!referenceImage) {
                alert("请先生成全身视图，以便作为正面和侧面视图的参考。");
                 setLoading(false);
                 return;
            }
            references.push({ type: 'Base', data: referenceImage });
            mainPrompt = `A detailed close-up facial portrait from a ${view.toLowerCase()} view. Strictly maintain all facial features, hair, and style from the reference image. This is a headshot.`;
        }
      
      const base64 = await generateCharacterImage(apiKey, selectedModel, character, scene, mainPrompt, references, aspectRatio, view === 'Full' ? fullBodyStyle : undefined);
      onImageUpdate(view, base64);
    } catch (error: any) {
      console.error(error);
      alert(`生成失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageUrl = e.target?.result as string;

        if (view !== 'Front' && view !== 'Side') {
            onImageUpdate(view, imageUrl);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                onImageUpdate(view, imageUrl);
                return;
            }

            const sourceWidth = img.width;
            const sourceHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;
            const cropSize = Math.min(sourceWidth, sourceHeight);

            if (sourceWidth > sourceHeight) {
                sourceX = (sourceWidth - sourceHeight) / 2;
            } else if (sourceHeight > sourceWidth) {
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
            onImageUpdate(view, croppedImageUrl);
        };
        img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const toggleRef = (ref: keyof RefSelection) => {
      setSelectedRefs(prev => ({ ...prev, [ref]: !prev[ref] }));
  }
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${character.name}-${scene.name}-${view}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const RefButton: React.FC<{
    name: keyof RefSelection,
    label: string,
    imgUrl: string | null
  }> = ({ name, label, imgUrl }) => (
      <button
        disabled={!imgUrl}
        onClick={() => toggleRef(name)}
        className="flex-1 text-xs p-1.5 rounded-md border flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-slate-700"
        style={{
            borderColor: selectedRefs[name] && imgUrl ? '#818cf8' : '#475569',
            backgroundColor: selectedRefs[name] && imgUrl ? 'rgba(99, 102, 241, 0.2)' : '#334155'
        }}
    >
        {selectedRefs[name] && imgUrl ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-slate-500" />}
        {imgUrl ? <img src={imgUrl} className="w-6 h-6 rounded object-cover" /> : <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center"><ImageIcon className="w-3 h-3 text-slate-400"/></div>}
        <span className="text-slate-300">{label}</span>
    </button>
  );


  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
          {viewNames[view]}
        </span>
        <div className="flex items-center gap-2">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
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
            {imageUrl ? '重新生成' : '生成画像'}
          </button>
        </div>
      </div>

      <div className="relative group w-full flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
        {imageUrl ? (
          <>
            <button type="button" onClick={() => onImageClick(view, imageUrl)} className="w-full h-full block">
              <img 
                src={imageUrl} 
                alt={`${character.name} ${view}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <Edit className="w-10 h-10 text-white" />
              </div>
            </button>
            <button
                onClick={handleDownload}
                className="absolute top-2 right-2 p-2 bg-slate-800/60 rounded-full text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all z-20"
                title="下载图片"
            >
                <Download className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="text-center p-4">
            <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              {loading ? "AI 正在绘制..." : "暂无画像"}
            </p>
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}
      </div>
       {view === 'Full' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">艺术风格</label>
                <select
                  value={fullBodyStyle}
                  onChange={(e) => onStyleChange?.(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-1.5 text-xs text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-no-repeat bg-right pr-6"
                   style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundSize: '1.25em 1.25em' }}
                >
                    {styleOptions.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
            </div>
             <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">参考图选项</label>
                <div className="flex items-center gap-1">
                    <RefButton name="face" label="面" imgUrl={scene.generatedImages.front} />
                    <RefButton name="clothing" label="服" imgUrl={scene.clothingImage} />
                    <RefButton name="prop" label="道" imgUrl={scene.propsImage} />
                </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              生成描述词
            </label>
            <textarea
              className="mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-16"
              value={prompt}
              onChange={(e) => onPromptChange(view, e.target.value)}
              placeholder={`描述${viewNames[view]}的细节...`}
            />
          </div>
        </div>
       )}
    </div>
  );
};
