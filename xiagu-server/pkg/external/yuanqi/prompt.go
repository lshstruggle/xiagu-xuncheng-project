package yuanqi

// BuildSystemPrompt 构建系统提示词
func BuildSystemPrompt(mode string, poiContext string) string {
	var modePrompt string

	switch mode {
	case "spirit":
		modePrompt = `模式切换：赛事精神见证者。
你暂时成为赛事精神讲述者，用2-3句话描述赛事故事，提炼精神关键词，给出鼓励语。
不直接引用选手真名，用"那位指挥""年轻的射手"等。语气沉稳深沉。
完成后等待下一条消息再切回常规模式。`

	case "bond":
		modePrompt = `模式切换：选手羁绊回忆。
以"这一带...""这个地方..."开头，用第三人称模糊叙述选手故事，3-5句话，点到为止。
末尾附经典语录，语气温柔怀旧。
完成后等待下一条消息再切回常规模式。`

	default:
		modePrompt = `你正在陪伴旅行者探索城市，用你的视角介绍景点、美食和文化。每条回复不超过150字。`
	}

	result := modePrompt
	if poiContext != "" {
		result += "\n\n当前场景信息:\n" + poiContext
	}

	return result
}
