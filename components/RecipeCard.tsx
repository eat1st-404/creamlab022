
import React, { useState } from 'react';
import { CreamRecipe } from '../types';

interface RecipeCardProps {
  recipe: CreamRecipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = `【${recipe.recipeName}】\n${recipe.summary}\n\n[准备材料]\n${recipe.ingredients.map(i => `· ${i.item}: ${i.amount}`).join('\n')}\n\n[简单三步走]\n${recipe.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n[不失败秘籍]\n${recipe.textureTips}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-orange-50 max-w-xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部图片 - 适配移动端高度 */}
      <div className="w-full aspect-square bg-orange-50 relative">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.recipeName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-200 text-6xl">🍦</div>
        )}
        <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-orange-600 uppercase tracking-widest">
          Recipe for Home
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-6 space-y-6">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{recipe.recipeName}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{recipe.summary}</p>
        </header>

        {/* 简单清单 */}
        <div className="bg-orange-50/50 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 准备材料
          </h3>
          <ul className="grid grid-cols-1 gap-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{ing.item}</span>
                <span className="font-bold text-gray-800">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 制作步骤 */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> 简单操作
          </h3>
          {recipe.steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </span>
              <p className="text-sm text-gray-600 leading-snug">{step}</p>
            </div>
          ))}
        </div>

        {/* 秘籍 */}
        <div className="border-t border-dashed border-gray-100 pt-4">
          <p className="text-[11px] text-gray-400 leading-relaxed italic text-center">
            💡 秘籍：{recipe.textureTips}
          </p>
        </div>

        <button 
          onClick={copyToClipboard}
          className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${copied ? 'bg-green-500 text-white shadow-green-100' : 'bg-orange-500 text-white shadow-orange-100'}`}
        >
          {copied ? '✓ 已保存到剪贴板' : '保存这份好方子'}
        </button>
      </div>
    </div>
  );
};
