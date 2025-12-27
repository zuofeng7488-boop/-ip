import React, { useState } from 'react';
import { X, Save, Wand2, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { editCharacterImage } from '../services/geminiService';

interface ImageEditorModalProps {
  imageInfo: { view: string; url: string };
  apiKey: string;
  selectedModel: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ imageInfo, apiKey, selectedModel, onSave, onClose }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!editPrompt.trim()) {
      alert('请输入修改描述。');
      return;
    }
    setIsGenerating(true);
    setNewImageUrl(null);
    try {
      const result = await editCharacterImage(
        apiKey,
        selectedModel,
        imageInfo.url,
        editPrompt
      );
      setNewImageUrl(result);
    } catch (e: any) {
      alert(`二次生成失败: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (newImageUrl) {
      onSave(newImageUrl);
    }
  };
  
  const handleDownloadNewImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!newImageUrl) return;
    const link = document.createElement('a');
    link.href = newImageUrl;
    link.download = `edited-${imageInfo.view}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-700">
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">二次创作与修改</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <button onClick={handleSave} disabled={!newImageUrl || isGenerating} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors">
              <Save className="w-4 h-4"/> 保存修改
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 bg-slate-950 p-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-slate-400 text-center">原始图片</h3>
                <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                    <img src={imageInfo.url} className="max-w-full max-h-full object-contain" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-slate-400 text-center">生成结果</h3>
                <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden relative group">
                    {isGenerating ? (
                         <div className="text-center text-slate-500">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-400 mb-2"/>
                            <p>AI 正在创作中...</p>
                         </div>
                    ) : newImageUrl ? (
                        <>
                         <img src={newImageUrl} className="max-w-full max-h-full object-contain" />
                         <button
                            onClick={handleDownloadNewImage}
                            className="absolute top-2 right-2 p-2 bg-slate-800/60 rounded-full text-white hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all z-20"
                            title="下载图片"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        </>
                    ) : (
                        <div className="text-center text-slate-600">
                           <ImageIcon className="w-10 h-10 mx-auto mb-2"/>
                           <p>修改后的图片将显示在这里</p>
                        </div>
                    )}
                </div>
            </div>
          </main>

          <aside className="w-80 bg-slate-900 p-6 border-l border-slate-800 overflow-y-auto flex flex-col">
            <h3 className="text-sm font-bold text-indigo-400 mb-4 flex-shrink-0">修改指令</h3>
            <p className="text-xs text-slate-400 mb-4 flex-shrink-0">请用清晰的语言描述您想如何修改这张图片。例如：“给他戴上一顶牛仔帽” 或 “把背景改成夜晚的雪山”。</p>
            <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="在此输入修改指令..."
                className="w-full flex-1 bg-slate-800 border border-slate-700 rounded-md p-3 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-md text-sm transition-colors"
            >
                {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin"/> 处理中...</> : <><Wand2 className="w-5 h-5" /> 应用修改</>}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};
