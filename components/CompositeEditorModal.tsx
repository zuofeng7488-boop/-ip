import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneSetting } from '../types';
import { X, Save, ZoomIn, ZoomOut, Move, ArrowLeftRight, ArrowUpDown } from 'lucide-react';

interface CompositeEditorModalProps {
  scene: SceneSetting;
  onSave: (base64: string) => void;
  onClose: () => void;
}

interface Transform {
  scale: number;
  x: number;
  y: number;
}

interface LoadedImages {
  full: HTMLImageElement | null;
  front: HTMLImageElement | null;
  side: HTMLImageElement | null;
}

const ControlSlider: React.FC<{ label: string; icon: React.ReactNode; value: number; onChange: (v: number) => void; min: number; max: number; step: number; }> = ({ label, icon, value, onChange, ...props }) => (
  <div className="grid grid-cols-[auto,1fr,50px] items-center gap-2">
    <div className="text-slate-400" title={label}>{icon}</div>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      {...props}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
    />
    <span className="text-sm text-center text-slate-300 font-mono">{value.toFixed(2)}</span>
  </div>
);


export const CompositeEditorModal: React.FC<CompositeEditorModalProps> = ({ scene, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<LoadedImages>({ full: null, front: null, side: null });
  const [isLoading, setIsLoading] = useState(true);

  // Default transform values
  const [frontTransform, setFrontTransform] = useState<Transform>({ scale: 0.48, x: 640, y: 40 });
  const [sideTransform, setSideTransform] = useState<Transform>({ scale: 0.48, x: 640, y: 560 });

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, images: LoadedImages, ft: Transform, st: Transform, final: boolean = false) => {
    const canvas = ctx.canvas;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { full, front, side } = images;
    if (!full || !front || !side) return;

    // --- Draw Full Body Image (maintaining aspect ratio) ---
    const padding = 40;
    const fullMaxHeight = canvas.height - padding * 2;
    const fullAspectRatio = full.naturalWidth / full.naturalHeight;
    const fullHeight = fullMaxHeight;
    const fullWidth = fullHeight * fullAspectRatio;
    ctx.drawImage(full, padding, padding, fullWidth, fullHeight);

    // --- Draw Front and Side Portraits ---
    const drawPortrait = (img: HTMLImageElement, transform: Transform) => {
      const w = img.naturalWidth * transform.scale;
      const h = img.naturalHeight * transform.scale;
      ctx.drawImage(img, transform.x, transform.y, w, h);
    };

    drawPortrait(front, ft);
    drawPortrait(side, st);
    
    if (final) {
        // Draw labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';

        ctx.fillText('全身视图', padding + (fullWidth / 2), fullHeight + 65);
        ctx.fillText('面部正面', ft.x + (front.naturalWidth * ft.scale / 2), ft.y + (front.naturalHeight * ft.scale) + 25);
        ctx.fillText('面部侧面', st.x + (side.naturalWidth * st.scale / 2), st.y + (side.naturalHeight * st.scale) + 25);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });

    Promise.all([
      loadImage(scene.generatedImages.full!),
      loadImage(scene.generatedImages.front!),
      loadImage(scene.generatedImages.side!),
    ]).then(([full, front, side]) => {
      setLoadedImages({ full, front, side });
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to load images for editor", err);
      alert("加载图片失败，无法打开编辑器。");
      onClose();
    });
  }, [scene, onClose]);

  useEffect(() => {
    if (!isLoading && loadedImages.full && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawCanvas(ctx, loadedImages, frontTransform, sideTransform);
      }
    }
  }, [isLoading, loadedImages, frontTransform, sideTransform, drawCanvas]);

  const handleSave = () => {
    if (!loadedImages.full) return;
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 1200;
    finalCanvas.height = 1080;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    drawCanvas(ctx, loadedImages, frontTransform, sideTransform, true);
    
    onSave(finalCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-700">
        <header className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">调整三视图布局</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors"><Save className="w-4 h-4"/> 保存合图</button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 bg-slate-950 p-4 flex items-center justify-center">
            {isLoading ? (
              <p className="text-slate-400">正在加载图片...</p>
            ) : (
              <canvas ref={canvasRef} width="1200" height="1080" className="max-w-full max-h-full object-contain" />
            )}
          </main>

          <aside className="w-80 bg-slate-900 p-6 border-l border-slate-800 overflow-y-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-indigo-400 mb-4 border-b border-slate-700 pb-2">正面视图控制</h3>
                <div className="space-y-4">
                  <ControlSlider label="缩放" icon={<ZoomIn className="w-4 h-4" />} value={frontTransform.scale} onChange={v => setFrontTransform(t => ({...t, scale: v}))} min={0.1} max={1.5} step={0.01} />
                  <ControlSlider label="X轴位置" icon={<ArrowLeftRight className="w-4 h-4" />} value={frontTransform.x} onChange={v => setFrontTransform(t => ({...t, x: v}))} min={-200} max={1200} step={1} />
                  <ControlSlider label="Y轴位置" icon={<ArrowUpDown className="w-4 h-4" />} value={frontTransform.y} onChange={v => setFrontTransform(t => ({...t, y: v}))} min={-200} max={1080} step={1} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-indigo-400 mb-4 border-b border-slate-700 pb-2">侧面视图控制</h3>
                <div className="space-y-4">
                  <ControlSlider label="缩放" icon={<ZoomIn className="w-4 h-4" />} value={sideTransform.scale} onChange={v => setSideTransform(t => ({...t, scale: v}))} min={0.1} max={1.5} step={0.01} />
                  <ControlSlider label="X轴位置" icon={<ArrowLeftRight className="w-4 h-4" />} value={sideTransform.x} onChange={v => setSideTransform(t => ({...t, x: v}))} min={-200} max={1200} step={1} />
                  <ControlSlider label="Y轴位置" icon={<ArrowUpDown className="w-4 h-4" />} value={sideTransform.y} onChange={v => setSideTransform(t => ({...t, y: v}))} min={-200} max={1080} step={1} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};