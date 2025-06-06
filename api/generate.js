// 【Gemini API版】 api/generate.js

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // ★変更点1：Vercelに設定する環境変数の名前を 'GOOGLE_API_KEY' に変更
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    return response.status(500).json({ error: 'APIキーがサーバーに設定されていません。' });
  }

  const { prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: '旅行の要望(prompt)がありません。' });
  }

  // ★変更点2：Gemini APIのエンドポイント(宛先URL)に変更
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  try {
    // ★変更点3：Gemini APIが要求する形式(payload)に変更
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048, // Geminiではmax_tokensではなくmaxOutputTokens
      }
    };

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 注意：Geminiの場合、Authorizationヘッダーは不要。URLにキーを含める。
      body: JSON.stringify(payload)
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Google APIからのエラー:', data);
      const errorMessage = data.error?.message || 'Google APIで不明なエラーが発生しました';
      throw new Error(errorMessage);
    }
    
    // Geminiからの回答は少し深い階層にあるため、取り出し方を変更
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('回答が生成されませんでした:', data);
      throw new Error('AIが安全でないコンテンツと判断したため、回答を生成できませんでした。');
    }

    response.status(200).json({ content: content });

  } catch (error) {
    console.error('サーバー内部エラー:', error);
    response.status(500).json({ error: `サーバー内部でエラーが発生しました: ${error.message}` });
  }
}