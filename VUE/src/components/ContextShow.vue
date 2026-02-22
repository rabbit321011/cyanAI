<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import 'katex/dist/katex.min.css'

// ==================== TypeScript 类型定义 ====================

/**
 * 单条消息的数据结构（对外暴露的类型）
 * @description 定义了一条消息需要的所有字段
 */
export interface MessageItem {
  /** 头像图片路径，可为 null */
  icon: string | null
  /** 消息内容（可以是文本或文件路径） */
  current: string
  /** 发言人名称 */
  speaker: string
  /** 消息来源类型，可选：'file' 表示从文件加载，'raw' 表示直接是文本 */
  currentFrom?: 'file' | 'raw'
}

/**
 * 内部使用的消息类型（带动画标记）
 * @description 继承自 MessageItem，添加了 _isAnimating 标记用于动画控制
 */
interface InternalMessageItem extends MessageItem {
  /** 标记消息是否正在执行入场动画 */
  _isAnimating?: boolean
}

/**
 * 组件 Props 类型定义
 * @description 定义了父组件可以传入的所有属性
 */
interface Props {
  /** 外部传入的消息数组（旧方式，与内部状态兼容） */
  contextArray?: MessageItem[]
  /** 主题名称，当前仅支持 'dark' */
  theme?: 'dark' | string
  /** 组件宽度，CSS 长度值，如 '100%' 或 '800px' */
  width?: string
  /** 组件高度，CSS 长度值，如 '100%' 或 '600px' */
  height?: string
  /** 用户发言人的名称，用于区分用户消息和 AI 消息 */
  userSpeakerName?: string
}

// ==================== 常量配置 ====================

/** 有效主题列表，当前仅支持深色主题 */
const VALID_THEMES = ['dark']

/** 显示"滚动到底部"按钮的阈值（像素）
 *  当距离底部超过此值时，显示按钮
 */
const SCROLL_BUTTON_THRESHOLD = 100

/** 用户向上滚动足够远的阈值（像素）
 *  当距离底部超过此值时，添加新消息时保持当前视口，不自动滚动
 */
const SCROLL_UP_THRESHOLD = 500

/** 认为用户在底部附近的阈值（像素）
 *  当距离底部小于此值时，添加新消息时直接跳到底部
 */
const SCROLL_NEAR_BOTTOM_THRESHOLD = 20

/** 平滑滚动到底部的动画时长（毫秒） */
const SCROLL_DURATION = 300

/** 消息入场动画的时长（毫秒） */
const MESSAGE_ANIMATION_DURATION = 400

// ==================== Markdown 渲染器初始化 ====================

/**
 * 配置 Marked 库，添加 KaTeX 数学公式支持
 * @description 使得消息中的 LaTeX 数学公式可以被正确渲染
 */
marked.use(markedKatex({
  throwOnError: false,
  nonStandard: true
}))

// ==================== Props 定义与默认值 ====================

/**
 * 组件 Props 对象
 * @description 使用 withDefaults 设置默认值
 */
const props = withDefaults(defineProps<Props>(), {
  theme: 'dark',
  width: '100%',
  height: '100%',
  userSpeakerName: 'now_user'
})

// ==================== 内部响应式状态管理 ====================

/**
 * 滚动容器的 DOM 引用
 * @description 用于操作滚动位置和监听滚动事件
 */
const containerRef = ref<HTMLElement | null>(null)

/**
 * 是否显示"滚动到底部"按钮
 * @description 当用户向上滚动远离底部时显示
 */
const showScrollToBottom = ref(false)

/**
 * 已加载的文件内容缓存
 * @description Map<消息索引, 已加载的文件内容字符串>
 */
const messageContents = ref<Map<number, string>>(new Map())

/**
 * 正在加载中的消息索引集合
 * @description 防止同一文件被重复加载
 */
const loadingMessages = ref<Set<number>>(new Set())

/**
 * 内部维护的消息数组（不直接暴露）
 * @description 通过 setContext() 和 addMessage() 方法修改
 */
const _internalContextArray = ref<InternalMessageItem[]>([])

/**
 * 消息动画队列
 * @description 当快速添加多条消息时，消息会进入队列，等待前一条动画完成
 */
const messageQueue = ref<MessageItem[]>([])

/**
 * 是否正在执行消息动画
 * @description 标记当前是否有消息正在入场，用于控制队列处理
 */
const isAnimating = ref(false)

// ==================== 计算属性 ====================

/**
 * 验证主题是否有效
 * @returns 主题有效返回 true，无效返回 false
 * @description 如果主题无效，会在控制台打印错误信息
 */
const isValidTheme = computed(() => {
  if (!VALID_THEMES.includes(props.theme)) {
    console.error(`组件contextShow:未定义的theme:${props.theme}`)
    return false
  }
  return true
})

/**
 * 实际渲染用的消息数组（兼容层）
 * @returns 优先返回 props.contextArray，如果不存在则返回内部状态
 * @description 使得组件同时支持两种使用方式：
 *              1. 父组件直接传入 contextArray prop（旧方式）
 *              2. 通过暴露的 setContext/addMessage 方法（新方式）
 */
const displayContextArray = computed(() => {
  if (props.contextArray && props.contextArray.length > 0) {
    return props.contextArray
  }
  return _internalContextArray.value
})

// ==================== 工具函数 ====================

/**
 * 判断是否为用户消息
 * @param speaker 发言人名称
 * @returns 是用户消息返回 true，否则返回 false
 * @description 通过比较 speaker 是否等于 userSpeakerName prop 来判断
 */
const isNowUser = (speaker: string): boolean => speaker === props.userSpeakerName

/**
 * 等待指定毫秒数的 Promise 包装
 * @param ms 需要等待的毫秒数
 * @returns 在指定时间后 resolve 的 Promise
 * @description 用于在异步函数中实现延迟
 */
const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ==================== Markdown 渲染相关函数 ====================

/**
 * 渲染 Markdown 内容为 HTML
 * @param content 原始内容字符串
 * @param speaker 发言人名称
 * @returns 渲染后的 HTML 字符串或纯文本
 * @description 用户消息直接返回纯文本（不解析），AI 消息解析 Markdown
 */
const renderMarkdown = (content: string, speaker: string): string => {
  if (isNowUser(speaker)) {
    return content
  }
  return marked.parse(content) as string
}

// ==================== 文件加载相关函数 ====================

/**
 * 异步加载 Markdown 文件内容
 * @param filePath 文件路径（相对于 public 目录）
 * @param index 消息在数组中的索引
 * @description 使用 fetch API 加载文件，加载完成后缓存到 messageContents
 */
const loadFileContent = async (filePath: string, index: number): Promise<void> => {
  if (loadingMessages.value.has(index)) {
    return
  }
  
  loadingMessages.value.add(index)
  
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to load file: ${filePath}`)
    }
    const text = await response.text()
    messageContents.value.set(index, text)
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error)
    messageContents.value.set(index, `[Error loading file: ${filePath}]`)
  } finally {
    loadingMessages.value.delete(index)
    nextTick(() => {
      scrollToBottom()
    })
  }
}

/**
 * 获取消息的最终显示内容
 * @param item 消息项对象
 * @param index 消息在数组中的索引
 * @returns 要显示的内容字符串
 * @description 如果是文件类型且未加载，触发加载并返回 'Loading...'
 *              如果是文件类型且已加载，返回缓存内容
 *              否则直接返回原始内容
 */
const getMessageContent = (item: MessageItem, index: number): string => {
  const currentFrom = item.currentFrom || 'raw'
  
  if (currentFrom === 'file') {
    if (!messageContents.value.has(index)) {
      loadFileContent(item.current, index)
      return 'Loading...'
    }
    return messageContents.value.get(index) || ''
  }
  
  return item.current
}

// ==================== 滚动相关函数 ====================

/**
 * 立即滚动到底部（无动画）
 * @description 使用 nextTick 确保 DOM 更新后再滚动
 */
const scrollToBottom = (): void => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTo({
        top: containerRef.value.scrollHeight,
        behavior: 'auto'
      })
    }
  })
}

/**
 * 平滑滚动到底部（带动画）
 * @returns 在滚动完成或超时后 resolve 的 Promise
 * @description 使用 smooth 行为，并设置超时确保 Promise 一定会 resolve
 */
const scrollToBottomSmooth = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!containerRef.value) {
      resolve()
      return
    }
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth'
    })
    setTimeout(() => {
      resolve()
    }, SCROLL_DURATION + 50)
  })
}

/**
 * 判断用户是否向上滚动了足够远
 * @returns 距离底部 >= SCROLL_UP_THRESHOLD 返回 true
 * @description 用于决定添加新消息时是否保持当前视口
 */
const isScrolledUpEnough = (): boolean => {
  if (!containerRef.value) return false
  const { scrollHeight, scrollTop, clientHeight } = containerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  return distanceFromBottom >= SCROLL_UP_THRESHOLD
}

/**
 * 判断用户是否在底部附近
 * @returns 距离底部 < SCROLL_NEAR_BOTTOM_THRESHOLD 返回 true
 * @description 用于决定添加新消息时是直接跳转还是平滑滚动
 */
const isNearBottom = (): boolean => {
  if (!containerRef.value) return true
  const { scrollHeight, scrollTop, clientHeight } = containerRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  return distanceFromBottom < SCROLL_NEAR_BOTTOM_THRESHOLD
}

/**
 * 滚动事件处理函数
 * @description 监听滚动位置，决定是否显示"滚动到底部"按钮
 */
const handleScroll = (): void => {
  if (containerRef.value) {
    const { scrollHeight, scrollTop, clientHeight } = containerRef.value
    const isNearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_BUTTON_THRESHOLD
    showScrollToBottom.value = !isNearBottom
  }
}

// ==================== 核心功能函数（暴露给父组件） ====================

/**
 * 设置完整的上下文（覆盖现有内容）
 * @param context 完整的消息数组
 * @description 清空现有内容和队列，设置新的上下文，然后滚动到底部
 */
const setContext = (context: MessageItem[]): void => {
  _internalContextArray.value = [...context]
  messageQueue.value = []
  isAnimating.value = false
  nextTick(() => {
    scrollToBottom()
  })
}

/**
 * 添加单条消息（带动画和队列机制）
 * @param message 要添加的消息对象
 * @description 如果当前正在执行动画，消息会加入队列等待
 *              否则立即处理消息的入场动画
 */
const addMessage = (message: MessageItem): void => {
  if (isAnimating.value) {
    messageQueue.value.push(message)
    return
  }
  processAddMessage(message)
}

/**
 * 处理添加消息的核心逻辑（内部函数）
 * @param message 要添加的消息对象
 * @description 实现消息的入场动画、滚动判断、队列处理等完整流程
 */
const processAddMessage = async (message: MessageItem): Promise<void> => {
  isAnimating.value = true
  
  const internalMessage: InternalMessageItem = {
    ...message,
    _isAnimating: true
  }
  _internalContextArray.value.push(internalMessage)
  
  const index = _internalContextArray.value.length - 1
  
  await nextTick()
  
  if (isScrolledUpEnough()) {
    const savedScrollTop = containerRef.value?.scrollTop || 0
    const msg = _internalContextArray.value[index]
    if (msg) {
      msg._isAnimating = false
    }
    await nextTick()
    if (containerRef.value) {
      containerRef.value.scrollTop = savedScrollTop
    }
  } else {
    const nearBottom = isNearBottom()
    
    if (nearBottom) {
      scrollToBottom()
    } else {
      await scrollToBottomSmooth()
    }
    
    const msg = _internalContextArray.value[index]
    if (msg) {
      msg._isAnimating = false
    }
    
    await wait(MESSAGE_ANIMATION_DURATION)
  }
  
  isAnimating.value = false
  
  if (messageQueue.value.length > 0) {
    const nextMessage = messageQueue.value.shift()!
    await processAddMessage(nextMessage)
  }
}

// ==================== 暴露方法给父组件 ====================

/**
 * 暴露给父组件的方法
 * @description 父组件可以通过 ref 调用这些方法
 */
defineExpose({
  setContext,
  addMessage
})

// ==================== Vue 生命周期钩子 ====================

/**
 * 组件挂载后执行
 * @description 初始滚动到底部，并添加滚动事件监听器
 */
onMounted(() => {
  scrollToBottom()
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll)
  }
})

/**
 * 组件卸载前执行
 * @description 移除滚动事件监听器，防止内存泄漏
 */
onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll)
  }
})

/**
 * 监听 props.contextArray 的变化
 * @description 当父组件传入的消息数组长度变化时，自动滚动到底部
 */
watch(() => props.contextArray?.length, () => {
  scrollToBottom()
})
</script>

<template>
  <div 
    ref="containerRef" 
    v-if="isValidTheme" 
    class="context-show" 
    :class="`theme-${theme}`" 
    :style="{ width, height }"
  >
    <div class="messages-container">
      <!-- 消息列表循环渲染 -->
      <div
        v-for="(item, index) in displayContextArray"
        :key="index"
        class="message-item"
        :class="{ 
          'user-message': isNowUser(item.speaker),
          'animating': (item as InternalMessageItem)._isAnimating
        }"
      >
        <div class="message-wrapper">
          <!-- AI 消息的头像（左侧） -->
          <div v-if="!isNowUser(item.speaker)" class="avatar">
            <img v-if="item.icon" :src="item.icon" alt="avatar" class="avatar-image" />
            <div v-else class="avatar-placeholder"></div>
          </div>
          
          <!-- 消息内容区域 -->
          <div class="message-content">
            <!-- 发言人名称 -->
            <div class="speaker-name">{{ item.speaker }}</div>
            <!-- 消息文本 -->
            <div class="message-text">
              <!-- 用户消息：纯文本显示 -->
              <div v-if="isNowUser(item.speaker)">
                {{ getMessageContent(item, index) }}
              </div>
              <!-- AI 消息：Markdown 渲染为 HTML -->
              <div 
                v-else 
                class="markdown-content" 
                v-html="renderMarkdown(getMessageContent(item, index), item.speaker)"
              ></div>
            </div>
          </div>
          
          <!-- 用户消息的头像（右侧） -->
          <div v-if="isNowUser(item.speaker)" class="avatar">
            <img v-if="item.icon" :src="item.icon" alt="avatar" class="avatar-image" />
            <div v-else class="avatar-placeholder"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 滚动到底部按钮（sticky 定位） -->
    <button 
      v-if="showScrollToBottom" 
      class="scroll-to-bottom-btn"
      @click="scrollToBottom"
      aria-label="滚动到底部"
    >
      ↓
    </button>
  </div>
</template>

<style scoped>
/* ==================== 容器基础样式 ==================== */
.context-show {
  overflow-y: auto;
  position: relative;
}

/* ==================== 主题样式 ==================== */
.theme-dark {
  background-color: #1a1a2e;
}

/* ==================== 消息容器 ==================== */
.messages-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ==================== 消息项基础样式 ==================== */
.message-item {
  display: flex;
  justify-content: flex-start;
  transition: opacity 0.4s ease, transform 0.4s ease;
}

/* 用户消息靠右对齐 */
.message-item.user-message {
  justify-content: flex-end;
}

/* 消息入场动画状态：淡入 + 缩放 */
.message-item.animating {
  opacity: 0;
  transform: scale(0.8);
}

/* ==================== 消息包装器 ==================== */
.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
}

/* ==================== 头像样式 ==================== */
.avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4a4a6a;
}

/* ==================== 消息内容区域 ==================== */
.message-content {
  flex: 1;
}

.speaker-name {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-align: left;
}

/* 用户消息的发言人名称靠右 */
.message-item.user-message .speaker-name {
  text-align: right;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: left;
  box-sizing: border-box;
}

/* ==================== Markdown 内容样式 ==================== */
.markdown-content {
  max-width: 100%;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Markdown 标题样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: bold;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
}

.markdown-content :deep(h2) {
  font-size: 1.25em;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
}

/* Markdown 段落样式 */
.markdown-content :deep(p) {
  margin: 0.5em 0;
}

/* Markdown 列表样式 */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.markdown-content :deep(li) {
  margin: 0.25em 0;
}

/* Markdown 代码样式 */
.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5em 0;
  max-width: 100%;
  box-sizing: border-box;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
}

/* Markdown 引用样式 */
.markdown-content :deep(blockquote) {
  border-left: 4px solid #4a4a6a;
  padding-left: 1em;
  margin: 0.5em 0;
  color: #aaa;
}

/* Markdown 链接样式 */
.markdown-content :deep(a) {
  color: #6b8cff;
  text-decoration: underline;
}

/* Markdown 图片样式 */
.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

/* Markdown 表格样式 */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #4a4a6a;
  padding: 0.5em;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: rgba(0, 0, 0, 0.2);
}

/* ==================== 深色主题消息文本样式 ==================== */
.theme-dark .message-text {
  background-color: #2d2d44;
  color: #e0e0e0;
}

.theme-dark .message-item.user-message .message-text {
  background-color: #4a4a6a;
  color: #ffffff;
}

/* ==================== 滚动到底部按钮 ==================== */
.scroll-to-bottom-btn {
  position: sticky;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #4a4a6a;
  color: #ffffff;
  border: none;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.scroll-to-bottom-btn:hover {
  background-color: #5a5a7a;
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.scroll-to-bottom-btn:active {
  transform: translateX(-50%) translateY(0);
}
</style>
