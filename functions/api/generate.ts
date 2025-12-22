// 文件路径: functions/api/generate.ts

interface Env {
  DMX_API_KEY: string;
}

// Cloudflare 处理 POST 请求的固定写法: onRequestPost
export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // 1. 获取密钥 (Cloudflare 从 env 中读取，而不是 process.env)
  const apiKey = env.DMX_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务端未配置 DMX_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 2. 解析前端发来的数据
    const prefs = await request.json();

    // ==========================================
    // 提示词逻辑 (和之前一样)
    // ==========================================
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

    // 3. 转发给 DMXAPI
    const model = "gemini-2.5-flash";
    const apiUrl = `https://www.dmxapi.cn/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const textPayload = {
      contents: [{ role: "user", parts: [{ text: textPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        // 简化的 Schema，防止报错
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
        return new Response(JSON.stringify({ error: `DMXAPI Error: ${errText}` }), { status: 500 });
    }

    const data: any = await apiResp.json();
    const recipeJsonStr = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};