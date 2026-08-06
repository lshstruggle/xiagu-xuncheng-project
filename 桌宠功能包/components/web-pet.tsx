"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { CircleHelp, Send, X, Loader2 } from "lucide-react"

type PetState = "idle" | "thinking" | "dragging" | "clicked"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const welcomeDialogues = [
  "大河之剑天上来！要来一杯吗？",
  "欢迎来到我的主页，想要知道成都什么信息吗都可以问我！",
  "简历看完了吗？有什么想问的尽管问！",
  "想了解我的 AI Agent 项目经历吗？往下滑~",
]

export default function WebPet() {
  const [state, setState] = useState<PetState>("idle")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 对话状态
  const [dialogue, setDialogue] = useState("")
  const [showBubble, setShowBubble] = useState(false)
  const [isChatMode, setIsChatMode] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)
  const [sessionId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  // 对话记录
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  // 所有定时器 ref
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const twIndex = useRef(0)
  const twTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dialogueEndRef = useRef<(() => void) | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ========== 初始位置：右侧上方区域 ==========
  useEffect(() => {
    const initPosition = () => {
      const petSize = 120
      const margin = 20
      const x = window.innerWidth - petSize - margin
      const y = Math.round(window.innerHeight * 0.25)
      setPosition({ x, y })
      setIsReady(true)
    }
    initPosition()
    window.addEventListener("resize", initPosition)
    return () => window.removeEventListener("resize", initPosition)
  }, [])

  // 移动端检测
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 根据桌宠 x 坐标判断气泡朝向（是否在左半边）
  const bubbleOnLeft = useMemo(() => position.x < (typeof window !== "undefined" ? window.innerWidth / 2 : 0), [position.x])

  // ========== 打字机效果 ==========
  const startTypewriter = useCallback((text: string, onEnd?: () => void) => {
    if (twTimer.current) clearInterval(twTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)

    twIndex.current = 0
    dialogueEndRef.current = onEnd || null
    setDialogue("")
    setShowBubble(true)

    twTimer.current = setInterval(() => {
      if (twIndex.current < text.length) {
        twIndex.current++
        setDialogue(text.slice(0, twIndex.current))
      } else {
        if (twTimer.current) clearInterval(twTimer.current)
        if (dialogueEndRef.current) {
          dialogueEndRef.current()
          dialogueEndRef.current = null
        }
      }
    }, 50)
  }, [])

  // 随机触发欢迎语（每 20 秒，纯文字模式）
  useEffect(() => {
    idleTimerRef.current = setInterval(() => {
      if (state === "idle" && !showBubble && !isWaiting && !isChatMode) {
        startTypewriter(welcomeDialogues[Math.floor(Math.random() * welcomeDialogues.length)], () => {
          setTimeout(() => {
            if (!isWaiting && !isChatMode) setShowBubble(false)
          }, 6000)
        })
      }
    }, 20000)
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [state, showBubble, isWaiting, isChatMode, startTypewriter])

  // 聊天记录变化时自动滚动到底部
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatHistory, dialogue, isWaiting])

  // 组件卸载清理所有定时器
  useEffect(() => {
    return () => {
      if (twTimer.current) clearInterval(twTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (idleTimerRef.current) clearInterval(idleTimerRef.current)
    }
  }, [])

  // ========== 鼠标拖拽 ==========
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    isDragging.current = true
    setState("dragging")

    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const petSize = 120
    const nextX = Math.max(0, Math.min(window.innerWidth - petSize, e.clientX - dragOffset.current.x))
    const nextY = Math.max(0, Math.min(window.innerHeight - petSize, e.clientY - dragOffset.current.y))
    setPosition({ x: nextX, y: nextY })
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      setState("idle")
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove])

  // 触摸开始位置，用于区分轻触和拖拽
  const touchStart = useRef({ x: 0, y: 0 })

  // ========== 触摸开始 ==========
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    isDragging.current = true
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    }
  }

  // ========== 触摸移动 ==========
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const petSize = 120

    // 移动距离超过阈值才判定为拖拽
    const dx = Math.abs(touch.clientX - touchStart.current.x)
    const dy = Math.abs(touch.clientY - touchStart.current.y)
    if (dx > 5 || dy > 5) {
      setState("dragging")
      const nextX = Math.max(0, Math.min(window.innerWidth - petSize, touch.clientX - dragOffset.current.x))
      const nextY = Math.max(0, Math.min(window.innerHeight - petSize, touch.clientY - dragOffset.current.y))
      setPosition({ x: nextX, y: nextY })
    }
  }

  // ========== 触摸结束：区分轻触和拖拽 ==========
  const handleTouchEnd = () => {
    if (isDragging.current) {
      isDragging.current = false
      if (state !== "dragging") {
        // 轻触 → 触发 clicked 状态
        setState("clicked")
        handleClick({ stopPropagation: () => {} } as React.MouseEvent)
        setTimeout(() => setState("idle"), 1500)
      } else {
        setState("idle")
      }
    }
  }

  // ========== 点击展开/收起对话气泡 ==========
  const handleClick = (e: React.MouseEvent) => {
    if (isDragging.current) return
    e.stopPropagation()
    setShowBubble((prev) => {
      if (!prev) {
        setIsChatMode(false) // 首次展开是纯文字欢迎模式
        startTypewriter(welcomeDialogues[Math.floor(Math.random() * welcomeDialogues.length)])
      }
      return !prev
    })
    setState("idle")
  }

  // ========== 切换到聊天模式 ==========
  const handleStartChat = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsChatMode(true)
    setDialogue("")
    setInputText("")
  }

  // ========== 关闭气泡 ==========
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (twTimer.current) clearInterval(twTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowBubble(false)
    setIsChatMode(false)
    setInputText("")
    setDialogue("")
    setIsWaiting(false)
  }

  // ========== 提交问题 → 调用元器 API ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputText.trim()
    if (!text || isWaiting) return

    // 将用户消息加入历史
    const userMsg: ChatMessage = { role: "user", content: text }
    setChatHistory((prev) => [...prev, userMsg])
    setInputText("")
    setDialogue("")
    setIsWaiting(true)
    setState("thinking")

    let assistantContent = ""

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: sessionId }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      setState("thinking")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === "[DONE]" || trimmed === "data: [DONE]") continue

          const jsonStr = trimmed.startsWith("data: ")
            ? trimmed.slice(6)
            : trimmed

          try {
            const data = JSON.parse(jsonStr)
            const content =
              data.choices?.[0]?.delta?.content ||
              data.content ||
              ""

            if (content) {
              assistantContent += content
              setDialogue(assistantContent)
            }
          } catch {
            // 非 JSON 行，忽略
          }
        }
      }

      // AI 回复完成，加入历史
      if (assistantContent) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: assistantContent }])
      }
    } catch {
      const errorMsg = "网络似乎有点小波动，请稍后再试！"
      setDialogue(errorMsg)
      setChatHistory((prev) => [...prev, { role: "assistant", content: errorMsg }])
    } finally {
      setIsWaiting(false)
      setDialogue("")
      setTimeout(() => {
        setState("idle")
      }, 8000)
    }
  }

  if (!isReady || isMobile) return null

  // 状态映射到 GIF
  const getPetSrc = (): string => {
    switch (state) {
      case "thinking": return "/assets/pet/thinking.gif"
      case "dragging": return "/assets/pet/dragging.gif"
      case "clicked": return "/assets/pet/clicked.gif"
      default: return "/assets/pet/idle.gif"
    }
  }

  // ========== 气泡定位样式 ==========
  // 欢迎模式（纯文字）：始终在桌宠正上方，间距大
  // 聊天模式：智能侧边定位，箭头指向桌宠
  const isLeft = bubbleOnLeft

  return (
    <div
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
    >
      {/* ========== 欢迎语气泡（纯文字模式） ========== */}
      {showBubble && !isChatMode && (
        <div
          className="absolute -top-[110px] left-1/2 -translate-x-1/2 w-[240px] bg-card text-card-foreground border border-border p-3 rounded-2xl shadow-xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </button>

          {/* 文字展示 */}
          <div className="text-sm leading-relaxed pr-5">
            {dialogue && (
              <>
                {state === "thinking" && (
                  <CircleHelp className="inline-block w-3 h-3 mr-1 text-primary animate-bounce flex-shrink-0" />
                )}
                {dialogue}
              </>
            )}
          </div>

          {/* 切换到聊天按钮 */}
          <button
            onClick={handleStartChat}
            className="text-xs text-primary hover:text-primary/80 font-medium text-left transition-colors"
          >
            → 问我点什么
          </button>

          {/* 箭头：朝下指向桌宠 */}
          <div className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 border-[9px] border-transparent border-t-card" />
        </div>
      )}

      {/* ========== 聊天交互窗口（智能侧边定位） ========== */}
      {showBubble && isChatMode && (
        <div
          className={`absolute bottom-0 flex flex-col gap-3 w-[280px] bg-card text-card-foreground border border-border p-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            isLeft ? "left-[120px]" : "right-[120px]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </button>

          {/* 对话记录区 */}
          <div ref={chatScrollRef} className="text-sm leading-relaxed max-h-[200px] overflow-y-auto pr-1 space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <span
                  className={`inline-block max-w-[220px] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </span>
              </div>
            ))}
            {/* 当前正在流式输出的回复 */}
            {isWaiting && !dialogue && (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl rounded-bl-sm bg-muted text-muted-foreground text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  思考中...
                </span>
              </div>
            )}
            {dialogue && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <span className="inline-block max-w-[220px] px-3 py-1.5 rounded-xl rounded-bl-sm bg-muted text-foreground text-xs leading-relaxed">
                  {(state === "thinking") && (
                    <CircleHelp className="inline-block w-3 h-3 mr-1 text-primary animate-bounce flex-shrink-0 align-text-bottom" />
                  )}
                  {dialogue}
                </span>
              </div>
            )}
          </div>

          {/* 输入表单 */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="问我点什么..."
              className="flex-1 h-8 px-3 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={isWaiting}
            />
            <button
              type="submit"
              disabled={isWaiting || !inputText.trim()}
              className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isWaiting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </button>
          </form>

          {/* 箭头：朝内指向桌宠 */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 border-[9px] border-transparent ${
              isLeft
                ? "-left-[18px] border-r-card"
                : "-right-[18px] border-l-card"
            }`}
          />
        </div>
      )}

      {/* ========== 桌宠本体 GIF ========== */}
      <div
        onMouseDown={handleMouseDown}
        onMouseEnter={() => {
          if (state === "idle") {
            setState("clicked")
          }
        }}
        onMouseLeave={() => {
          if (state === "clicked") {
            setState("idle")
          }
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-[120px] h-[120px] cursor-grab active:cursor-grabbing transition-transform duration-150 ${
          state === "dragging" ? "animate-wiggle" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getPetSrc()}
          alt="AI 桌宠"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  )
}
