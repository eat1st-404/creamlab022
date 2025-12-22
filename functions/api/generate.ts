// 文件路径: functions/api/generate.ts

interface Env {
  DMX_API_KEY: string;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // 1. 检查密钥
  const apiKey = env.DMX_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "No API Key" }), { status: 500 });
  }

  try {
    const prefs = await request.json();

    // 2. 准备提示词 (关键：我们在提示词里强调只要 JSON)
    // @ts-ignore
    const flavorStr = Object.entries(prefs.flavorLevels || {}).map(([k, v]) => `${k}:${v}%`).join(', ');
    
    const prompt = `
      你是一个专业甜点师。请设计一款奶油配方。
      要求：
      - 原料: ${prefs.ingredients}
      - 风味: ${flavorStr}
      - 口感: ${prefs.texture}
      
      【重要】请只返回纯净的 JSON 格式数据，不要Markdown标记，不要废话。
      JSON结构如下：
      {
        "recipeName": "名字",
        "ingredients": [{"item": "材料名", "amount": "用量"}],
        "steps": ["步骤1", "步骤2"],
        "flavorProfile": {"sweetness": 5, "acidity": 3, "creaminess": 8},
        "summary": "一句话介绍",
        "pairingSuggestions": "搭配建议",
        "textureTips": "口感提示"
      }
    `;

    // 3. 请求 DMXAPI (完全模仿 Python 示例的简单写法)
    const model = "gemini-2.5-flash"; 
    const apiUrl = `https://www.dmxapi.cn/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // ❌ 删除了 generationConfig，防止接口不支持
    const payload = {
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }] 
      }]
    };

    const apiResp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiResp.ok) {
        const err = await apiResp.text();
        return new Response(JSON.stringify({ error: `DMX Error ${apiResp.status}: ${err}` }), { status: 500 });
    }

    const data: any = await apiResp.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // 4. 手动清洗数据 (代替 Schema)
    if (text) {
      // 去掉可能存在的 ```json 代码块标记
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const recipeData = JSON.parse(text);

    return new Response(JSON.stringify({
      ...recipeData,
      id: Date.now().toString(),
      timestamp: Date.now()
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
