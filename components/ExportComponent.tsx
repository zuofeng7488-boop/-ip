import React, { forwardRef } from 'react';
import { CharacterProfile } from '../types';

interface ExportProps {
  characters: CharacterProfile[];
}

const DetailCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    value ? (
        <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{value}</p>
        </div>
    ) : null
);

const ImageCard: React.FC<{ label: string; src: string | null }> = ({ label, src }) => (
    src ? (
        <div style={{ breakInside: 'avoid' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px', textAlign: 'center' }}>{label}</p>
            <img src={src} style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }} alt={label} />
        </div>
    ) : null
);

export const ExportComponent = forwardRef<HTMLDivElement, ExportProps>(({ characters }, ref) => {
  return (
    <div ref={ref} style={{ width: '1240px', backgroundColor: '#0f172a', color: '#e2e8f0', padding: '40px', fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>
      <header style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #334155', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', margin: 0, color: '#c4b5fd' }}>CineCast 角色设定集</h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '8px' }}>生成日期: {new Date().toLocaleDateString('zh-CN')}</p>
      </header>

      {characters.map((char, charIndex) => (
        <section key={char.id} style={{ breakBefore: charIndex > 0 ? 'page' : 'auto', marginBottom: '60px', breakInside: 'avoid-page' }}>
          <header style={{ display: 'flex', alignItems: 'baseline', gap: '16px', borderBottom: '1px solid #475569', paddingBottom: '16px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: 'white', margin: 0 }}>{char.name}</h2>
            <span style={{ fontSize: '16px', fontWeight: 500, backgroundColor: '#334155', color: '#c4b5fd', padding: '4px 12px', borderRadius: '16px' }}>{char.roleType}</span>
          </header>
          
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#93c5fd', margin: '0 0 16px 0', borderLeft: '3px solid #93c5fd', paddingLeft: '12px' }}>基本特征</h3>
             <p style={{ fontSize: '14px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{char.physicalFeatures || '未提供'}</p>
          </div>

          {char.scenes.map((scene, sceneIndex) => (
            <article key={scene.id} style={{ breakInside: 'avoid-page', marginTop: sceneIndex > 0 ? '40px' : '0' }}>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 24px 0', color: '#a5b4fc' }}>场景: {scene.name}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
                        <DetailCard label="场景描述" value={scene.description} />
                        <DetailCard label="场景环境" value={scene.environment} />
                        <DetailCard label="时间 / 光照" value={scene.time} />
                    </div>
                    <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
                        <DetailCard label="服装配饰" value={scene.clothing} />
                        <DetailCard label="道具 / 武器" value={scene.props} />
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#93c5fd', margin: '0 0 16px 0', borderLeft: '3px solid #93c5fd', paddingLeft: '12px' }}>视觉参考</h4>
                    {scene.generatedImages.composite ? (
                        <div style={{ padding: '16px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
                          <ImageCard label="三视图合一" src={scene.generatedImages.composite} />
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                            <div style={{ gridRow: 'span 2' }}>
                                <ImageCard label="全身视图" src={scene.generatedImages.full} />
                            </div>
                            <ImageCard label="面部正面视图" src={scene.generatedImages.front} />
                            <ImageCard label="面部侧面视图" src={scene.generatedImages.side} />
                        </div>
                      )}
                </div>

                <div style={{ marginTop: '24px' }}>
                     <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#93c5fd', margin: '0 0 16px 0', borderLeft: '3px solid #93c5fd', paddingLeft: '12px' }}>服装与道具参考图</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <ImageCard label="服装配饰" src={scene.clothingImage} />
                        <ImageCard label="道具 / 武器" src={scene.propsImage} />
                     </div>
                </div>

              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
});