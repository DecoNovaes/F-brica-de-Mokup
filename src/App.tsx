import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Download, RefreshCw, Loader2, Wand2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMockup } from './services/geminiService';

const CATEGORIES = [
  { id: 'papelaria', label: 'Papelaria (Cartão, Papel timbrado)' },
  { id: 'fachada', label: 'Fachada de Loja' },
  { id: 'embalagem', label: 'Embalagem (Caixa, Pote)' },
  { id: 'camiseta', label: 'Camiseta / Vestuário' },
  { id: 'mobile', label: 'Smartphone (Tela)' },
  { id: 'desktop', label: 'Desktop (Monitor)' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'caneca', label: 'Caneca' },
  { id: 'outdoor', label: 'Outdoor / Painel' },
  { id: 'sacola', label: 'Sacola (Tote bag)' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Quadrado (1:1)' },
  { id: '16:9', label: 'Paisagem / Widescreen (16:9)' },
  { id: '9:16', label: 'Retrato / Stories (9:16)' },
  { id: '4:3', label: 'Monitor Clássico (4:3)' },
  { id: '3:4', label: 'Retrato Clássico (3:4)' },
];

interface GeneratedImage {
  id: string;
  url: string;
  isLoading: boolean;
  error?: string;
}

export default function App() {
  const [selectedImage, setSelectedImage] = useState<{ url: string; mimeType: string } | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].id);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; index: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          url: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage({
          url: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const generateSingleMockup = async (imageId: string) => {
    if (!selectedImage) return;
    
    setResults(prev => prev.map(img => 
      img.id === imageId ? { ...img, isLoading: true, error: undefined } : img
    ));

    try {
      const categoryLabel = CATEGORIES.find(c => c.id === category)?.label || category;
      const url = await generateMockup(selectedImage.url, selectedImage.mimeType, categoryLabel, customPrompt, aspectRatio);
      
      setResults(prev => prev.map(img => 
        img.id === imageId ? { ...img, url, isLoading: false } : img
      ));
    } catch (error: any) {
      setResults(prev => prev.map(img => 
        img.id === imageId ? { ...img, isLoading: false, error: error.message || 'Erro ao gerar' } : img
      ));
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedImage) return;
    
    setIsGenerating(true);
    
    // Initialize 1 empty loading slot
    const initialResults = Array.from({ length: 1 }).map((_, i) => ({
      id: `mockup-${Date.now()}-${i}`,
      url: '',
      isLoading: true,
    }));
    
    setResults(initialResults);

    // Generate sequentially to avoid rate limits
    for (const img of initialResults) {
      await generateSingleMockup(img.id);
      // Add a small delay between requests to help prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsGenerating(false);
  };

  const handleDownload = (url: string, index: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `mockup-${category}-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">MockupGen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Configurações</h2>
              
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Imagem Base (PNG/JPG)
                </label>
                
                {!selectedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center cursor-pointer hover:bg-neutral-50 hover:border-indigo-400 transition-colors group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                    />
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-neutral-900">Clique ou arraste uma imagem</p>
                    <p className="text-xs text-neutral-500 mt-1">PNG ou JPG até 5MB</p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-200 group">
                    <img src={selectedImage.url} alt="Selected" className="w-full h-48 object-contain bg-neutral-100" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="bg-white text-red-600 p-2 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Select */}
              <div className="mb-6">
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                  Categoria do Mockup
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio Select */}
              <div className="mb-6">
                <label htmlFor="aspectRatio" className="block text-sm font-medium text-neutral-700 mb-2">
                  Formato / Tamanho
                </label>
                <select
                  id="aspectRatio"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 bg-white text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                >
                  {ASPECT_RATIOS.map(ar => (
                    <option key={ar.id} value={ar.id}>{ar.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom Prompt */}
              <div className="mb-6">
                <label htmlFor="prompt" className="block text-sm font-medium text-neutral-700 mb-2">
                  Detalhes Adicionais (Opcional)
                </label>
                <textarea
                  id="prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Ambiente minimalista, iluminação natural, fundo de madeira..."
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 bg-white text-neutral-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAll}
                disabled={!selectedImage || isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando Mockup...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Gerar Mockup
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Area - Results */}
          <div className="lg:col-span-8">
            {results.length === 0 ? (
              <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-neutral-400 bg-white/50">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium text-neutral-600">Nenhum mockup gerado ainda</p>
                <p className="text-sm mt-1">Faça o upload de uma imagem e clique em gerar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col"
                    >
                      <div className="h-[400px] bg-neutral-100 relative flex items-center justify-center overflow-hidden">
                        {result.isLoading ? (
                          <div className="flex flex-col items-center text-neutral-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-600" />
                            <span className="text-sm font-medium">Gerando variação {index + 1}...</span>
                          </div>
                        ) : result.error ? (
                          <div className="flex flex-col items-center text-red-500 p-6 text-center">
                            <span className="text-sm font-medium mb-2">{result.error}</span>
                          </div>
                        ) : (
                          <div 
                            className="w-full h-full cursor-pointer group/img relative"
                            onClick={() => setPreviewImage({ url: result.url, index })}
                          >
                            <img 
                              src={result.url} 
                              alt={`Mockup ${index + 1}`} 
                              className="w-full h-full object-contain transition-transform duration-300 group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                              <span className="bg-white/90 text-neutral-900 px-3 py-1.5 rounded-full text-sm font-medium opacity-0 group-hover/img:opacity-100 transition-opacity transform translate-y-2 group-hover/img:translate-y-0">
                                Ampliar
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 bg-white border-t border-neutral-100 flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(result.url, index)}
                          disabled={result.isLoading || !!result.error}
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                          Baixar
                        </button>
                        <button
                          onClick={() => generateSingleMockup(result.id)}
                          disabled={result.isLoading}
                          className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Refazer esta variação"
                        >
                          <RefreshCw className={`w-4 h-4 ${result.isLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-medium">
                  Visualização - Mockup {previewImage.index + 1}
                </h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body (Image) */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[50vh]">
                <img
                  src={previewImage.url}
                  alt={`Mockup Preview ${previewImage.index + 1}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => handleDownload(previewImage.url, previewImage.index)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-6 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Baixar Imagem
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
