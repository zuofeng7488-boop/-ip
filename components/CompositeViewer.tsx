import React, { useState } from 'react';
import { SceneSetting } from '../types';
import { Loader2, Image as ImageIcon, Edit, Combine, Settings2, Download } from 'lucide-react';
import { CompositeEditorModal } from './CompositeEditorModal';

interface CompositeViewerProps {
  scene: SceneSetting;
  onImageUpdate: (base64: string) => void;
  onImageClick: (view: string, url: string) => void;
}

export const CompositeViewer: React.FC<CompositeViewerProps> = ({ scene, onImageUpdate, onImageClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const imageUrl = scene.generatedImages.composite;

  const handleOpenEditor = () => {
    const { full, front, side } = scene.generatedImages;
    if (!full || !front || !side) {
      alert("请先生成全身、正面和侧面视图，才能进行调整与合并。");
      return;
    }
    setIsEditing(true);
  };

  const handleSave = (base64: string) => {
    onImageUpdate(base64);
    setIsEditing(false);
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${scene.name}-三视图合一.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <div className="flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
            三视图合一
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenEditor}
              className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-2 py-1 rounded transition-colors"
            >
              <Settings2 className="w-3 h-3" />
              调整与合并
            </button>
          </div>
        </div>

        <div className="relative group w-full flex-1 bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
          {imageUrl ? (
            <>
              <button type="button" onClick={() => onImageClick('composite', imageUrl)} className="w-full h-full block">
                <img 
                  src={imageUrl} 
                  alt="三视图合一"
                  className="w-full h-full object-contain"
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
                暂无合图
              </p>
            </div>
          )}
        </div>
      </div>
      {isEditing && (
        <CompositeEditorModal
          scene={scene}
          onSave={handleSave}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
};
