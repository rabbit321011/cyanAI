<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useWindowSize } from '@vueuse/core'
import ContextShow, { type MessageItem } from './components/ContextShow.vue'

/**
 * 获取浏览器窗口尺寸
 * @description 使用 @vueuse/core 的 useWindowSize 响应式获取窗口宽高
 */
const { width, height } = useWindowSize()

/**
 * ContextShow 组件的引用
 * @description 用于调用组件暴露的方法：setContext() 和 addMessage()
 */
const contextShowRef = ref<InstanceType<typeof ContextShow> | null>(null)

// ==================== 测试数据定义 ====================

/**
 * 初始示例消息数组
 * @description 组件加载时的初始对话内容，包含两条消息
 */
const initialContext: MessageItem[] = [
  {
    icon: '/img/test_icon.png',
    current: '/main.md',
    speaker: 'cyanAI',
    currentFrom: 'file'
  },
  {
    icon: '/img/test_icon.png',
    current: '# 欢迎使用 cyanAI！\n\n你好！我是 **cyanAI助手**，很高兴为您服务。',
    speaker: 'cyanAI'
  }
]

/**
 * 生成指定数量汉字的测试文本
 * @param count 需要生成的汉字数量
 * @returns 生成的中文文本字符串
 * @description 循环从固定字符池中取字符，生成指定长度的文本
 */
const generateChineseText = (count: number): string => {
  const chars = '测试消息这是一个用于验证动画效果的中文文本内容'
  let result = ''
  for (let i = 0; i < count; i++) {
    result += chars[i % chars.length]
  }
  return result
}

/**
 * 创建测试消息对象
 * @param text 消息内容文本
 * @param speaker 消息发言人名称，默认为 'now_user'
 * @returns 完整的 MessageItem 对象
 * @description 封装了创建消息的通用逻辑，使用统一的测试图标
 */
const createTestMessage = (text: string, speaker: string = 'now_user'): MessageItem => {
  return {
    icon: '/img/test_icon.png',
    current: text,
    speaker
  }
}

// ==================== 测试循环控制 ====================

/**
 * 测试循环是否正在运行的标志
 * @description 用于控制测试循环的启动和停止，防止重复启动
 */
let isTesting = false

/**
 * 当前测试轮次计数
 * @description 记录已经完成了多少轮完整的测试循环
 */
let currentRound = 0

/**
 * 启动测试循环
 * @description 加载初始上下文，然后进入无限测试循环
 *              循环内容：等待15秒 → 添加10条消息（第10条批量添加3条）→ 等待15秒 → 重复
 */
const startTest = async (): Promise<void> => {
  if (isTesting) return
  isTesting = true
  
  console.log('测试开始，加载初始上下文...')
  contextShowRef.value?.setContext(initialContext)

  while (isTesting) {
    console.log('等待 15 秒后开始添加消息...')
    await wait(15000)
    if (!isTesting) break

    for (let i = 1; i <= 10; i++) {
      if (!isTesting) break
      
      console.log(`准备添加第 ${i} 条消息...`)
      if (i <= 9) {
        const charCount = i * 10
        const text = `第${i}条消息：${generateChineseText(charCount)}`
        console.log(`  添加 ${charCount} 个汉字的消息`)
        contextShowRef.value?.addMessage(createTestMessage(text))
      } else {
        console.log('  批量添加 3 条消息...')
        contextShowRef.value?.addMessage(createTestMessage('第10轮第1条：批量添加测试1'))
        console.log('    添加第 1 条')
        contextShowRef.value?.addMessage(createTestMessage('第10轮第2条：批量添加测试2'))
        console.log('    添加第 2 条')
        contextShowRef.value?.addMessage(createTestMessage('第10轮第3条：批量添加测试3'))
        console.log('    添加第 3 条')
      }
      console.log('  等待 5 秒...')
      await wait(5000)
    }

    if (!isTesting) break

    console.log('10 条消息添加完成，等待 15 秒...')
    await wait(15000)
    currentRound++
    console.log(`完成第 ${currentRound} 轮测试，开始下一轮...`)
  }
}

/**
 * 停止测试循环
 * @description 设置 isTesting 标志为 false，测试循环会在下一个检查点退出
 */
const stopTest = (): void => {
  isTesting = false
}

/**
 * 等待指定毫秒数的 Promise 包装函数
 * @param ms 需要等待的毫秒数
 * @returns 在指定时间后 resolve 的 Promise
 * @description 用于在异步函数中实现延迟等待
 */
const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// ==================== Vue 生命周期钩子 ====================

/**
 * 组件挂载后执行
 * @description 自动启动测试循环
 */
onMounted(() => {
  startTest()
})

/**
 * 组件卸载前执行
 * @description 停止测试循环，防止内存泄漏
 */
onUnmounted(() => {
  stopTest()
})
</script>

<template>
  <div class="app-container">
    <!-- 
      ContextShow 组件：核心对话展示组件
      - ref: 组件引用，用于调用暴露的方法
      - theme: 主题，当前仅支持 'dark'
      - width/height: 组件尺寸，使用浏览器窗口尺寸
    -->
    <ContextShow 
      ref="contextShowRef"
      theme="dark" 
      :width="`${width}px`" 
      :height="`${height}px`" 
    />
  </div>
</template>

<style scoped>
/**
 * 应用容器样式
 * @description 占满整个浏览器视口，隐藏溢出
 */
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
