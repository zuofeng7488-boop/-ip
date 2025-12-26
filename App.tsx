import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Film, 
  Download, 
  Sparkles,
  Clapperboard,
  Clock,
  Shirt,
  Swords,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { CharacterProfile, SceneSetting } from './types';
import { InputGroup } from './components/InputGroup';
import { ImageViewer } from './components/ImageViewer';
import { DetailImageUploader } from './components/DetailImageUploader';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ExportComponent } from './components/ExportComponent';
import { CompositeViewer } from './components/CompositeViewer';

// Define types for external libraries on window object
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const createNewScene = (name: string): SceneSetting => ({
  id: crypto.randomUUID(),
  name,
  description: '',
  environment: '',
  time: '',
  clothing: '',
  props: '',
  clothingImage: null,
  propsImage: null,
  clothingPrompt: '',
  propsPrompt: '',
  generatedImages: { front: null, side: null, full: null, composite: null },
  prompts: { front: '', side: '', full: '', composite: '' },
});


const initialCharacters: CharacterProfile[] = [
  {
    id: 'c1',
    roleType: 'Protagonist',
    name: 'Kaelen',
    physicalFeatures: '年轻男性，下颚线条锋利，机械义眼，右脸颊有一道旧伤疤',
    scenes: [
      {
        id: 's1-1',
        name: '雨夜追踪',
        description: '在霓虹闪烁的赛博朋克城市中追踪一个重要目标，气氛紧张。',
        environment: '霓虹街头',
        time: '午夜，暴雨',
        clothing: '带有LED灯带装饰的黑色皮风衣，战术靴，手指有金属植入物',
        props: '激光手枪，便携式黑客终端',
        clothingImage: null,
        propsImage: null,
        clothingPrompt: '一件充满未来感的黑色皮质风衣，衣领和袖口边缘镶嵌着发光的蓝色LED灯带，材质具有磨损感。',
        propsPrompt: '一把造型流畅的银色激光手枪，枪身有红色全息瞄准镜，枪口略带硝烟，充满赛博朋克美学。',
        generatedImages: { front: null, side: null, full: null, composite: null },
        prompts: {
          front: '年轻男性，下颚线条锋利，机械义眼，右脸颊有旧伤疤，正面肖像照，神情坚毅，电影质感',
          side: '年轻男性的侧脸轮廓，机械义眼发出微光，赛博朋克风格，细节丰富',
          full: '身穿带LED灯带的黑色皮风衣和战术靴的男性，站在霓虹灯闪烁的雨夜街头，全身照，动态姿势',
          composite: ''
        },
      }
    ],
  },
  {
    id: 'c2',
    roleType: 'Supporting',
    name: 'Anya',
    physicalFeatures: '身材高挑的女性，蓝色短发，运动型身材，手臂有纹身',
    scenes: [
       {
        id: 's2-1',
        name: '地下工坊',
        description: '在自己的秘密工坊中进行机械维修和升级，环境嘈杂但充满创造力。',
        environment: '地下酒吧',
        time: '傍晚',
        clothing: '沾满油污的机械师连体裤，护目镜挂在脖子上',
        props: '巨大的扳手，全息数据板',
        clothingImage: null,
        propsImage: null,
        clothingPrompt: '沾有油污的工装连体裤，袖子卷起露出纹身，口袋里塞着各种工具。',
        propsPrompt: '一把巨大的工业用扳手，头部呈齿轮状，看起来非常沉重且饱经风霜。',
        generatedImages: { front: null, side: null, full: null, composite: null },
        prompts: {
          front: '高挑的女性机械师，蓝色短发，眼神自信，正面肖像，背景是堆满零件的工坊',
          side: '女性机械师的侧脸，正在专注地修理设备，光线从一侧打来',
          full: '身穿连体裤的女性机械师，扛着巨大扳手，全身照，站在一艘飞船引擎旁',
          composite: ''
        },
      }
    ]
  },
];

const App: React.FC = () => {
  const [characters, setCharacters] = useState<CharacterProfile[]>(initialCharacters);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(characters[0]?.id || null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(characters[0]?.scenes[0]?.id || null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [openCharacterIds, setOpenCharacterIds] = useState<Set<string>>(() => 
    new Set(characters.length > 0 ? [characters[0].id] : [])
  );

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('selectedGenModel') || 'gemini-2.5-flash-image');
  const [showApiKey, setShowApiKey] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const activeCharacter = characters.find(c => c.id === activeCharacterId);
  const activeScene = activeCharacter?.scenes.find(s => s.id === activeSceneId);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);
  
  useEffect(() => {
    localStorage.setItem('selectedGenModel', selectedModel);
  }, [selectedModel]);

  const handleImagePreview = (url: string) => {
    setPreviewImageUrl(url);
  };

  useEffect(() => {
    if (editingId && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (isExporting && printRef.current) {
      const generatePdf = async () => {
        const { jsPDF } = window.jspdf;
        try {
          const element = printRef.current;
          const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#0f172a',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.85);

          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const canvasWidth = imgProps.width;
          const canvasHeight = imgProps.height;
          
          const ratio = canvasWidth / pdfWidth;
          const canvasHeightInPdf = canvasHeight / ratio;
          
          let position = 0;
          
          while (position < canvasHeightInPdf) {
            pdf.addImage(imgData, 'JPEG', 0, -position, pdfWidth, canvasHeightInPdf, undefined, 'FAST');
            position += pdfHeight;
            if (position < canvasHeightInPdf) {
              pdf.addPage();
            }
          }
          pdf.save(`CineCast_角色设定集.pdf`);
        } catch (err) {
          console.error("Export failed", err);
          alert("PDF 导出失败。");
        } finally {
          setIsExporting(false);
        }
      };
      setTimeout(generatePdf, 500);
    }
  }, [isExporting, characters]);

  const triggerExportPDF = () => {
    if (!characters.length) {
      alert("没有可导出的角色数据。");
      return;
    }
    setIsExporting(true);
  };

  const updateCharacter = (charId: string, field: keyof CharacterProfile, value: any) => {
    setCharacters(prev => prev.map(char => 
      char.id === charId ? { ...char, [field]: value } : char
    ));
  };
  
  const updateScene = (charId: string, sceneId: string, field: keyof SceneSetting, value: any) => {
    setCharacters(prev => prev.map(char => {
      if (char.id !== charId) return char;
      return {
        ...char,
        scenes: char.scenes.map(scene => 
          scene.id === sceneId ? { ...scene, [field]: value } : scene
        ),
      };
    }));
  };
  
  const updateSceneSubField = <K extends keyof SceneSetting, SK extends keyof SceneSetting[K]>(
    charId: string, sceneId: string, field: K, subField: SK, value: SceneSetting[K][SK]
  ) => {
     setCharacters(prev => prev.map(char => {
      if (char.id !== charId) return char;
      return {
        ...char,
        scenes: char.scenes.map(scene => {
          if (scene.id !== sceneId) return scene;
          return {
            ...scene,
            [field]: {
              ...scene[field],
              [subField]: value,
            },
          };
        }),
      };
    }));
  };
  
  const addNewCharacter = () => {
    const newId = crypto.randomUUID();
    const newScene = createNewScene('默认场景');
    const newCharacter: CharacterProfile = {
      id: newId,
      roleType: '配角',
      name: `新角色 ${characters.length + 1}`,
      physicalFeatures: '',
      scenes: [newScene],
    };
    setCharacters(prev => [...prev, newCharacter]);
    setActiveCharacterId(newId);
    setActiveSceneId(newScene.id);
    setOpenCharacterIds(prev => new Set(prev).add(newId));
  };
  
  const handleEditStart = (id: string, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  const addNewScene = (charId: string) => {
    const character = characters.find(c => c.id === charId);
    if (!character) return;

    const newScene = createNewScene(`场景 ${character.scenes.length + 1}`);

    setCharacters(prev => prev.map(char => 
      char.id === charId ? { ...char, scenes: [...char.scenes, newScene] } : char
    ));
    
    setActiveCharacterId(charId);
    setActiveSceneId(newScene.id);

    setOpenCharacterIds(prev => new Set(prev).add(charId));
    
    handleEditStart(newScene.id, newScene.name);
  };
  
  const deleteCharacter = (idToDelete: string) => {
    const newCharacters = characters.filter(c => c.id !== idToDelete);
    setCharacters(newCharacters);

    if (activeCharacterId === idToDelete) {
      if (newCharacters.length > 0) {
        const newActiveCharacter = newCharacters[0];
        setActiveCharacterId(newActiveCharacter.id);
        setActiveSceneId(newActiveCharacter.scenes[0]?.id || null);
      } else {
        setActiveCharacterId(null);
        setActiveSceneId(null);
      }
    }
  };
  
  const deleteScene = (charId: string, sceneIdToDelete: string) => {
    const newCharacters = characters.map(char => {
      if (char.id !== charId) {
        return char;
      }
      return { 
        ...char, 
        scenes: char.scenes.filter(s => s.id !== sceneIdToDelete) 
      };
    });
    setCharacters(newCharacters);

    if (activeSceneId === sceneIdToDelete) {
      const parentCharacter = newCharacters.find(c => c.id === charId);
      setActiveSceneId(parentCharacter?.scenes[0]?.id || null);
    }
  };

  const handleEditSave = () => {
    if (!editingId || !editingText.trim()) {
      setEditingId(null);
      return;
    }

    const charToUpdate = characters.find(c => c.id === editingId);
    if (charToUpdate) {
      updateCharacter(editingId, 'name', editingText);
    } else {
      for (const char of characters) {
        if (char.scenes.some(s => s.id === editingId)) {
          updateScene(char.id, editingId, 'name', editingText);
          break;
        }
      }
    }
    setEditingId(null);
  };

  const toggleCharacterOpen = (charId: string) => {
    setOpenCharacterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(charId)) newSet.delete(charId);
      else newSet.add(charId);
      return newSet;
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-400"><Clapperboard /> CineCast</h1>
          <p className="text-xs text-slate-500 mt-1">角色设计工坊</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {characters.map(char => (
            <div key={char.id} className="mb-1">
              <div className="relative group w-full">
                <div 
                    onClick={() => { if (editingId !== char.id) setActiveCharacterId(char.id); }}
                    onDoubleClick={() => handleEditStart(char.id, char.name)}
                    className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer pr-20 ${activeCharacterId === char.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                >
                  <button onClick={(e) => { e.stopPropagation(); toggleCharacterOpen(char.id); }} className="p-1 hover:bg-slate-700 rounded z-10">
                    {openCharacterIds.has(char.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingId === char.id ? (
                       <input ref={nameInputRef} type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onBlur={handleEditSave} onKeyDown={e => e.key === 'Enter' && handleEditSave()} className="w-full bg-slate-700 border border-indigo-500 rounded px-1 py-0 text-sm outline-none" onClick={e => e.stopPropagation()}/>
                    ) : (
                        <>
                            <div className="font-bold text-sm truncate text-slate-200">{char.name}</div>
                            <div className="text-[10px] text-slate-400">{char.roleType}</div>
                        </>
                    )}
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 h-full flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button title="添加新场景" onClick={() => addNewScene(char.id)} className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-700"><FilePlus2 className="w-4 h-4" /></button>
                    <button title="删除角色" onClick={() => deleteCharacter(char.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {openCharacterIds.has(char.id) && (
                <div className="pl-6 pt-1 space-y-1">
                  {char.scenes.length > 0 ? (
                    char.scenes.map(scene => (
                      <div key={scene.id} className="relative group w-full">
                        <div
                          onClick={() => { if (editingId !== scene.id) { setActiveCharacterId(char.id); setActiveSceneId(scene.id); }}}
                          onDoubleClick={() => handleEditStart(scene.id, scene.name)}
                          className={`w-full p-2 pl-3 rounded-md flex items-center gap-3 transition-all cursor-pointer border-l-2 pr-10 ${activeSceneId === scene.id ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100' : 'border-slate-700 hover:bg-slate-800/50 text-slate-400'}`}
                        >
                          <div className="flex-1 min-w-0">
                            {editingId === scene.id ? (
                              <input ref={nameInputRef} type="text" value={editingText} onChange={e => setEditingText(e.target.value)} onBlur={handleEditSave} onKeyDown={e => e.key === 'Enter' && handleEditSave()} className="w-full bg-slate-700 border border-indigo-500 rounded px-1 py-0 text-xs outline-none" />
                            ) : (
                              <div className="font-medium text-xs truncate">{scene.name}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute top-0 right-0 h-full flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button title="删除场景" onClick={() => deleteScene(char.id, scene.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-700">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic pl-3 py-1">无场景</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Settings className="w-4 h-4" /> 配置</h3>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Gemini API Key</label>
            <div className="relative">
              <input 
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="在此输入您的 API Key"
                className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
              />
              <button 
                onClick={() => setShowApiKey(!showApiKey)} 
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white"
                title={showApiKey ? '隐藏' : '显示'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">生图模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-no-repeat bg-right pr-8"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (快速)</option>
              <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image (高质量)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">高质量模型可能需要付费项目 API Key。</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={addNewCharacter} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 p-2.5 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4"/> 添加新角色</button>
          <button onClick={triggerExportPDF} disabled={isExporting} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white p-2.5 rounded-lg text-sm font-medium transition-colors">{isExporting ? <><Clock className="w-4 h-4 animate-spin"/> 正在导出...</> : <><Download className="w-4 h-4" /> 导出设定集 PDF</>}</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 relative">
        {!activeCharacter || !activeScene ? ( 
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              { !activeCharacter ? <Users className="w-16 h-16 mx-auto mb-4"/> : <Film className="w-16 h-16 mx-auto mb-4"/> }
              <h2 className="text-xl font-bold">{ !activeCharacter ? "无选中角色" : "无选中场景" }</h2>
              <p>{ !activeCharacter ? "请从左侧列表选择一个角色，或创建一个新角色。" : `请为角色 ${activeCharacter.name} 选择或创建一个新场景。` }</p>
            </div>
          </div> 
        ) : (
          <div className="max-w-6xl mx-auto p-8 min-h-full bg-slate-950">
            <header className="mb-8 flex items-start justify-between border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${activeCharacter.roleType === 'Protagonist' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700/30 text-slate-400 border border-slate-700'}`}>{activeCharacter.roleType}</span>
                  <h2 className="text-3xl font-bold text-white">{activeCharacter.name} <span className="text-slate-500 font-normal text-2xl">/ {activeScene.name}</span></h2>
                </div>
                <p className="text-slate-400 text-sm max-w-2xl">在下方配置细节，并使用生成或上传工具创建角色参考表。</p>
              </div>
              <div className="flex gap-4"><div className="text-right"><div className="text-xs text-slate-500 uppercase">场景编号</div><div className="font-mono text-indigo-400">SCN-{activeScene.id.substring(0,6).toUpperCase()}</div></div><div className="text-right border-l border-slate-800 pl-4"><div className="text-xs text-slate-500 uppercase">日期</div><div className="font-mono text-slate-300">{new Date().toLocaleDateString('zh-CN')}</div></div></div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <section className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Film className="w-4 h-4 text-indigo-500" /> 背景与身份</h3>
                  <div className="space-y-4">
                    <InputGroup label="角色名称" value={activeCharacter.name} onChange={(v) => updateCharacter(activeCharacter.id, 'name', v)} />
                    <InputGroup label="角色身份" value={activeCharacter.roleType} onChange={(v) => updateCharacter(activeCharacter.id, 'roleType', v)} placeholder="例如: 主角, 反派, NPC" />
                    <InputGroup label="外貌特征 (固定)" value={activeCharacter.physicalFeatures} onChange={(v) => updateCharacter(activeCharacter.id, 'physicalFeatures', v)} multiline placeholder="描述发型、面部特征、体型..."/>
                  </div>
                </section>
                
                <section className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/50">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Clapperboard className="w-4 h-4 text-cyan-500" /> 场景设定</h3>
                   <div className="space-y-4">
                    <InputGroup label="场景描述" value={activeScene.description} onChange={(v) => updateScene(activeCharacter.id, activeScene.id, 'description', v)} multiline placeholder="描述这个场景中发生的故事..."/>
                    <InputGroup label="场景环境" value={activeScene.environment} onChange={(v) => updateScene(activeCharacter.id, activeScene.id, 'environment', v)} placeholder="例如：赛博朋克巷弄"/>
                    <InputGroup label="时间 / 光照" value={activeScene.time} onChange={(v) => updateScene(activeCharacter.id, activeScene.id, 'time', v)} placeholder="例如：午夜，霓虹灯光"/>
                   </div>
                </section>

                <section className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Shirt className="w-4 h-4 text-emerald-500" /> 服装与道具 (本场景)</h3>
                  <div className="space-y-6">
                    <div>
                      <InputGroup label="服装配饰" value={activeScene.clothing} onChange={(v) => updateScene(activeCharacter.id, activeScene.id, 'clothing', v)} multiline placeholder="描述此场景的服装细节..."/>
                      <div className="mt-4"><DetailImageUploader label="服装配饰" imageUrl={activeScene.clothingImage} prompt={activeScene.clothingPrompt} character={activeCharacter} scene={activeScene} context="Clothing" apiKey={apiKey} selectedModel={selectedModel} onImageUpdate={(base64) => updateScene(activeCharacter.id, activeScene.id, 'clothingImage', base64)} onPromptChange={(prompt) => updateScene(activeCharacter.id, activeScene.id, 'clothingPrompt', prompt)} onImageClick={handleImagePreview}/></div>
                    </div>
                    <div>
                      <InputGroup label="道具 / 武器" value={activeScene.props} onChange={(v) => updateScene(activeCharacter.id, activeScene.id, 'props', v)} placeholder="例如：长剑，智能手机"/>
                      <div className="mt-4"><DetailImageUploader label="道具 / 武器" imageUrl={activeScene.propsImage} prompt={activeScene.propsPrompt} character={activeCharacter} scene={activeScene} context="Props" apiKey={apiKey} selectedModel={selectedModel} onImageUpdate={(base64) => updateScene(activeCharacter.id, activeScene.id, 'propsImage', base64)} onPromptChange={(prompt) => updateScene(activeCharacter.id, activeScene.id, 'propsPrompt', prompt)} onImageClick={handleImagePreview}/></div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> 视觉参考 (本场景)</h3>
                   <span className="text-xs text-slate-500 italic">由 {selectedModel} 驱动 或 手动上传</span>
                </div>
               
                <div className="grid grid-cols-2 grid-rows-2 gap-4" style={{minHeight: '600px'}}>
                  <ImageViewer view="Full" character={activeCharacter} scene={activeScene} prompt={activeScene.prompts.full} apiKey={apiKey} selectedModel={selectedModel} onImageUpdate={(v, b64) => updateSceneSubField(activeCharacter.id, activeScene.id, 'generatedImages', 'full', b64)} onPromptChange={(v, p) => updateSceneSubField(activeCharacter.id, activeScene.id, 'prompts', 'full', p)} onImageClick={handleImagePreview}/>
                  <ImageViewer view="Front" character={activeCharacter} scene={activeScene} prompt={activeScene.prompts.front} apiKey={apiKey} selectedModel={selectedModel} onImageUpdate={(v, b64) => updateSceneSubField(activeCharacter.id, activeScene.id, 'generatedImages', 'front', b64)} onPromptChange={(v, p) => updateSceneSubField(activeCharacter.id, activeScene.id, 'prompts', 'front', p)} onImageClick={handleImagePreview}/>
                  <CompositeViewer scene={activeScene} onImageUpdate={(b64) => updateSceneSubField(activeCharacter.id, activeScene.id, 'generatedImages', 'composite', b64)} onImageClick={handleImagePreview} />
                  <ImageViewer view="Side" character={activeCharacter} scene={activeScene} prompt={activeScene.prompts.side} apiKey={apiKey} selectedModel={selectedModel} onImageUpdate={(v, b64) => updateSceneSubField(activeCharacter.id, activeScene.id, 'generatedImages', 'side', b64)} onPromptChange={(v, p) => updateSceneSubField(activeCharacter.id, activeScene.id, 'prompts', 'side', p)} onImageClick={handleImagePreview}/>
                </div>

                <div className="mt-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-lg p-4 flex items-start gap-4">
                   <div className="bg-slate-800 p-2 rounded text-slate-400"><Swords className="w-5 h-5" /></div>
                   <div><h4 className="text-sm font-semibold text-slate-300">道具清单 (本场景)</h4><p className="text-sm text-slate-500 mt-1">{activeScene.props || "未分配道具"}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {previewImageUrl && (<ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />)}
      
      {/* Hidden container for PDF export content */}
      <div className="absolute left-[-9999px] top-0">
          {isExporting && <ExportComponent ref={printRef} characters={characters} />}
      </div>
    </div>
  );
};

export default App;