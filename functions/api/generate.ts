// 文件路径: functions/api/generate.ts

interface Env {
  DMX_API_KEY: string;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // 1. 安全检查：是否有密钥
  const apiKey = env.DMX_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务端未配置 DMX_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const prefs = await request.json();

    // 2. 准备提示词
    // @ts-ignore
    const flavorIntensityDesc = Object.entries(prefs.flavorLevels || {})
        // @ts-ignore
        .map(([flavor, level]) => `${flavor}: ${level}%`).join(', ');

    const textPrompt = `
      你是一位亲切的家庭甜点达人。根据以下条件设计一款奶油配方：
      原材料: ${prefs.ingredients}
      风味: ${flavorIntensityDesc}
      口感: ${prefs.texture}
      (请严格返回 JSON)
    `;

    // ---------------------------------------------------------
    // 🔧 修复点 1: 修改正确的模型名称 (1.5-flash)
    // ---------------------------------------------------------
    const model = "gemini-2.5-flash"; 
    const apiUrl = `https://www.dmxapi.cn/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const textPayload = {
      contents: [{ role: "user", parts: [{ text: textPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
           type: "OBJECT",
           properties: {
             recipeName: { type: "STRING" },
             summary: { type: "STRING" },
             ingredients: { type: "ARRAY", items: { type: "OBJECT", properties: { item: { type: "STRING" }, amount: { type: "STRING" } } } },
             steps: { type: "ARRAY", items: { type: "STRING" } },
             textureTips: { type: "STRING" },
             pairingSuggestions: { type: "STRING" },
             flavorProfile: { type: "OBJECT", properties: { sweetness: { type: "NUMBER" }, acidity: { type: "NUMBER" }, complexity: { type: "NUMBER" }, creaminess: { type: "NUMBER" }, innovation: { type: "NUMBER" } } }
           }
        }
      }
    };

    const apiResp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(textPayload)
    });

    if (!apiResp.ok) {
        const errText = await apiResp.text();
        // 这里把错误详情返回给前端，方便调试
        return new Response(JSON.stringify({ error: `API请求失败 (${apiResp.status}): ${errText}` }), { status: 500 });
    }

    const data: any = await apiResp.json();
    let recipeJsonStr = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // ---------------------------------------------------------
    // 🔧 修复点 2: 增强 JSON 解析 (防止 AI 虽然返回 JSON 但带着 ```json 标记)
    // ---------------------------------------------------------
    if (recipeJsonStr) {
      recipeJsonStr = recipeJsonStr.replace(/```json|```/g, '').trim();
    }

    const recipeData = JSON.parse(recipeJsonStr);

    // 4. 返回结果
    return new Response(JSON.stringify({
      ...recipeData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    // 捕获所有未知错误
    return new Response(JSON.stringify({ error: `服务器内部错误: ${err.message}` }), { status: 500 });
  }
};

