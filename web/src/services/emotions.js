// 情绪系统 — 与移动端保持一致
const DEFAULT_MAPPINGS = [
  { tag: 'idle',     label: '待机',   gifUrl: null, fallbackEmoji: '🤖' },
  { tag: 'happy',    label: '开心',   gifUrl: null, fallbackEmoji: '✨' },
  { tag: 'thinking', label: '思考',   gifUrl: null, fallbackEmoji: '🧠' },
  { tag: 'confused', label: '困惑',   gifUrl: null, fallbackEmoji: '🌀' },
  { tag: 'excited',  label: '兴奋',   gifUrl: null, fallbackEmoji: '⚡' },
  { tag: 'sad',      label: '难过',   gifUrl: null, fallbackEmoji: '🥀' },
  { tag: 'working',  label: '工作中', gifUrl: null, fallbackEmoji: '🔧' },
  { tag: 'error',    label: '出错',   gifUrl: null, fallbackEmoji: '💥' },
  { tag: 'sleeping', label: '睡觉',   gifUrl: null, fallbackEmoji: '🌙' },
]

const STORAGE_KEY = 'cyberpet_emotion_mappings'

export function getEmotionMappings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_MAPPINGS
}

export function saveEmotionMappings(mappings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings))
}

export function getMapping(tag) {
  const mappings = getEmotionMappings()
  return mappings.find(m => m.tag === tag) || mappings[0]
}

// 从 AI 回复中提取 emotion_tag（与移动端逻辑完全一致）
export function extractEmotion(text) {
  const match = text.match(/\[emotion:(\w+)\]\s*$/)
  if (match) {
    const tag = match[1]
    const validTags = ['idle','happy','thinking','confused','excited','sad','working','error','sleeping']
    if (validTags.includes(tag)) {
      return { content: text.replace(match[0], '').trim(), emotion: tag }
    }
  }
  return { content: text, emotion: 'idle' }
}

export const VALID_TAGS = ['idle','happy','thinking','confused','excited','sad','working','error','sleeping']
export { DEFAULT_MAPPINGS }
