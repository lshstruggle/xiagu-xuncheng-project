import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing message parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const appId = process.env.YUANQI_APP_ID || "2033060122909652160"
    const token = process.env.YUANQI_TOKEN || "t1R5g65kkN0L28LnA5jk45Y00hXO0p8L"

    const response = await fetch(
      "https://open.hunyuan.tencent.com/openapi/v1/agent/chat/completions",
      {
        method: "POST",
        headers: {
          "X-Source": "openapi",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assistant_id: appId,
          user_id: userId || `user_${Date.now()}`,
          stream: true,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: message }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Yuanqi API Error:", response.status, errorText)
      return new Response(
        JSON.stringify({ error: `API Error: ${response.status}`, detail: errorText }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      )
    }

    // 将元器 SSE 流透传给前端
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat route error:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch response", detail: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
