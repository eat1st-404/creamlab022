import { UserPreferences, CreamRecipe } from "../types";

// 这里不再需要 API KEY，也不需要复杂的 prompt 拼接
// 所有的脏活累活都交给 /api/generate 去做了

export const generateCreamRecipe = async (prefs: UserPreferences): Promise<CreamRecipe> => {
  try {
    // 呼叫我们刚刚写的后端 API
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prefs), // 直接把用户偏好扔给后端
    });

    if (!response.ok) {
      throw new Error(`生成失败: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 直接返回后端处理好的数据
    return data as CreamRecipe;

  } catch (error) {
    console.error("Generate Recipe Error:", error);
    throw error;
  }
};