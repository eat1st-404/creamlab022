
import React, { useState, useEffect } from 'react';
import { generateCreamRecipe } from './services/geminiService';
import { FlavorPreference, UserPreferences, CreamRecipe } from './types';
import { RecipeCard } from './components/RecipeCard';

const App: React.FC = () => {
  const [formData, setFormData] = useState<UserPreferences>({
    ingredients: '',
    flavorLevels: {
      [FlavorPreference.SWEET]: 30,
      [FlavorPreference.SOUR]: 0,
      [FlavorPreference.BITTER]: 0,
      [FlavorPreference.SPICY]: 0,
      [FlavorPreference.SALTY]: 0,
    },
    texture: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<CreamRecipe | null>(null);
  const [history, setHistory] = useState<CreamRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cream_lab_v2_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("History error"); }
    }
  }, []);

  const saveToHistory = (recipe: CreamRecipe) => {
    const updated = [recipe, ...history.slice(0, 11)];
    setHistory(updated);
    localStorage.setItem('cream_lab_v2_history', JSON.stringify(updated));
  };

  const handleFlavorChange = (flavor: FlavorPreference, value: number) => {
    setFormData(prev => ({
      ...prev,
      flavorLevels: { ...prev.flavorLevels, [flavor]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredients.trim() || !formData.texture.trim()) {
      alert("请随便写点材料和口感要求吧~");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateCreamRecipe(formData);
      setCurrentRecipe(result);
      saveToHistory(result);
    } catch (err: any) {
      setError("AI 走神了，请再试一次吧。");
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLabel = (val: number) => {
    if (val === 0) return '无';
    if (val < 40) return '微微 (约3分)';
    if (val < 75) return '适中';
    return '浓郁';
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-gray-800 pb-12">
      {/* 顶部简单的标题栏 */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-orange-50 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tight text-gray-900">
          Cream<span className="text-orange-500">Crafter</span>
        </h1>
        <div className="flex -space-x-2">
          {history.slice(0, 3).map((h) => (
            <div key={h.id} className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 overflow-hidden shadow-sm" onClick={() => setCurrentRecipe(h)}>
              {h.imageUrl && <img src={h.imageUrl} className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center animate-bounce mb-6">
              <span className="text-4xl">🍯</span>
            </div>
            <p className="text-lg font-bold text-gray-600">正在为你调配方...</p>
          </div>
        ) : currentRecipe ? (
          <div>
            <button 
              onClick={() => setCurrentRecipe(null)}
              className="mb-6 text-xs font-bold text-orange-400 flex items-center gap-1 uppercase tracking-widest"
            >
              ← 返回主页
            </button>
            <RecipeCard recipe={currentRecipe} />
          </div>
        ) : (
          <div className="space-y-10">
            {/* 输入表单 */}
            <div className="space-y-8">
              <section className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-orange-400">1. 你手里有什么材料？</label>
                <textarea
                  className="w-full h-28 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-orange-200 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-base placeholder:text-gray-200"
                  placeholder="比如：一颗草莓、一点酸奶、巧克力碎..."
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                />
              </section>

              <section className="space-y-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-orange-400">2. 调整你喜欢的口味</label>
                <div className="space-y-5 bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
                  {Object.values(FlavorPreference).map((flavor) => (
                    <div key={flavor} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-700">{flavor}味</span>
                        <span className="text-orange-500 font-medium">{getIntensityLabel(formData.flavorLevels[flavor])}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={formData.flavorLevels[flavor]}
                        onChange={(e) => handleFlavorChange(flavor, parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-100 rounded-full appearance-none accent-orange-400 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-orange-400">3. 想要什么口感？</label>
                <input
                  type="text"
                  className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-orange-200 focus:ring-4 focus:ring-orange-50 outline-none transition-all text-sm"
                  placeholder="如：像云朵一样轻盈"
                  value={formData.texture}
                  onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                />
              </section>

              <button
                onClick={handleSubmit}
                className="w-full py-5 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-100"
              >
                生成我的专属方子
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-300 font-medium tracking-wide">
              * AI 生成的方子仅供参考，制作时要注意卫生哦~
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-xl text-center text-xs font-bold border border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
