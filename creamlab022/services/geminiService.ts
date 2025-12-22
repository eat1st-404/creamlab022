import { UserPreferences, CreamRecipe } from "../types";

// 移除 @google/genai 依赖，改用原生 HTTP 请求
// import { GoogleGenAI, Type } from "@google/genai"; 

// ============================================================
// DMXAPI 配置 (参考 Python 示例 1.txt)
// ============================================================
const API_KEY = process.env.API_KEY as string;
const BASE_URL = "https://www.dmxapi.cn/v1beta"; // DMXAPI 基础地址

/**
 * 通用 DMXAPI 请求函数
 * 模拟 Python 示例中的 requests.post 行为
 */
async function callDmxGemini(model: string, payload: any) {
  // 构建 URL: https://www.dmxapi.cn/v1beta/models/{model}:generateContent?key={API_KEY}
  const url = `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DMXAPI request failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("DMXAPI Call Error:", error);
    throw error;
  }
}

export const generateCreamRecipe = async (prefs: UserPreferences): Promise<CreamRecipe> => {
  const flavorIntensityDesc = Object.entries(prefs.flavorLevels)
    .map(([flavor, level]) => `${flavor}: ${level}%`)
    .join(', ');

  // 1. 准备提示词
  const textPrompt = `
    你是一位非常擅长简化烘焙流程、亲切友好的家庭甜点达人。
    你的任务是根据用户现有的简单原材料，设计一款“零失败”且“超好上手”的创意奶油配方。
    
    用户原材料: ${prefs.ingredients}
    风味偏好: ${flavorIntensityDesc}
    期望口感: ${prefs.texture}
    
    输出要求：
    1. 做法必须简单！不需要专业实验室设备，只需要普通的打蛋器、锅具或冰箱。
    2. 材料要平易近人，尽量利用用户提供的材料加上最基础的烘焙基底（如淡奶油、酸奶、奶酪等）。
    3. 步骤清晰，就像在跟朋友说话一样，每一步都给出通俗易懂的指导。
    4. 评分系统 (0-100): 给出甜度、酸度、复杂度、丝滑度、创新度。
  `;

  // 2. 调用文本生成 API (Gemini 2.5 Flash)
  // 注意：这里手动构建 JSON Schema，替代了 SDK 的 Type.OBJECT 等
  const textPayload = {
    contents: [{
      role: "user",
      parts: [{ text: textPrompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          recipeName: { type: "STRING" },
          summary: { type: "STRING" },
          ingredients: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                item: { type: "STRING" },
                amount: { type: "STRING" }
              },
              required: ["item", "amount"]
            }
          },
          steps: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          textureTips: { type: "STRING" },
          pairingSuggestions: { type: "STRING" },
          flavorProfile: {
            type: "OBJECT",
            properties: {
              sweetness: { type: "NUMBER" },
              acidity: { type: "NUMBER" },
              complexity: { type: "NUMBER" },
              creaminess: { type: "NUMBER" },
              innovation: { type: "NUMBER" }
            },
            required: ["sweetness", "acidity", "complexity", "creaminess", "innovation"]
          }
        },
        required: ["recipeName", "summary", "ingredients", "steps", "textureTips", "pairingSuggestions", "flavorProfile"]
      }
    },
    systemInstruction: {
        parts: [{ text: "你是一个温暖的烘焙小助手，专门帮大家用简单的材料做超好吃的奶油。你的语气要轻松、鼓励，给出的建议必须是在家就能操作的。" }]
    }
  };

  const textResponseData = await callDmxGemini("gemini-2.5-flash", textPayload);

  // 解析响应：REST API 的结构通常在 candidates[0].content.parts[0].text 中
  const responseText = textResponseData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("Invalid response structure from DMXAPI");
  }
  const recipeData = JSON.parse(responseText);

  // 3. 调用图像生成 API
  // 依然使用 gemini-2.5-flash-image，通过同样的 HTTP 方式调用
  let imageUrl = "";
  try {
    const imagePrompt = `Soft home photography of ${recipeData.recipeName}. 
    A beautiful bowl of whipped cream, homemade style, naturally lit from a window, 
    on a wooden kitchen table, simple ceramic bowl, aesthetic and cozy vibes.`;
    
    // 注意：Gemini 图像生成通常在 REST API 中也是 generateContent，
    // 返回结构中包含 inlineData (Base64)
    const imagePayload = {
      contents: [{
        parts: [{ text: imagePrompt }]
      }],
      generationConfig: {
        // 如果 DMXAPI/Gemini 支持 imageConfig 参数，可以在这里传递
        // 注意：REST API 中某些参数可能略有不同，保持最简配置通常最稳妥
      }
    };

    const imageResponseData = await callDmxGemini("gemini-2.5-flash-image", imagePayload); // 假设 DMXAPI 支持此模型名称

    // 尝试提取图片
    const parts = imageResponseData?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        // Gemini REST API 返回的 mimeType 通常在 inlineData.mimeType
        const mimeType = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  } catch (imgError) {
    console.warn("Image generation failed via DMXAPI", imgError);
  }

  return {
    ...recipeData,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    imageUrl
  } as CreamRecipe;
};