<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * 组件 Props 类型定义
 * @description 定义了父组件可以传入的所有属性
 */
interface Props {
  /** 主题名称，当前仅支持 'dark' */
  theme?: 'dark' | string
  /** 组件宽度，CSS 长度值，如 '100%' 或 '800px' */
  width?: string
  /** 组件高度，CSS 长度值，如 '100px' 或 '200px' */
  height?: string
  /** 输入框占位文本 */
  placeholder?: string
  /** 输入框内容，支持双向绑定 */
  modelValue?: string
}

// ==================== 常量配置 ====================

/** 有效主题列表，当前仅支持深色主题 */
const VALID_THEMES = ['dark']

// ==================== Props 定义与默认值 ====================

/**
 * 组件 Props 对象
 * @description 使用 withDefaults 设置默认值
 */
const props = withDefaults(defineProps<Props>(), {
  theme: 'dark',
  width: '100%',
  height: '100px',
  placeholder: '输入消息...',
  modelValue: ''
})

/**
 * 定义组件事件
 * @description 用于双向绑定 v-model 和发送消息
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
}>()

// ==================== 内部状态管理 ====================

/**
 * 输入框的 DOM 引用
 * @description 用于操作输入框元素
 */
const inputRef = ref<HTMLTextAreaElement | null>(null)

/**
 * 输入框内容（本地状态）
 * @description 与 modelValue 双向绑定
 */
const inputValue = ref(props.modelValue)

// ==================== 计算属性 ====================

/**
 * 验证主题是否有效
 * @returns 主题有效返回 true，无效返回 false
 * @description 如果主题无效，会在控制台打印错误信息
 */
const isValidTheme = computed(() => {
  if (!VALID_THEMES.includes(props.theme)) {
    console.error(`组件InputBox:未定义的theme:${props.theme}`)
    return false
  }
  return true
})

// ==================== 事件处理函数 ====================

/**
 * 输入框内容变化时触发
 * @param event 输入事件对象
 * @description 更新本地状态并触发 update:modelValue 事件
 */
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  inputValue.value = target.value
  emit('update:modelValue', target.value)
}

/**
 * 键盘事件处理
 * @param event 键盘事件对象
 * @description 处理 Enter 键发送消息和 Shift+Enter 换行
 */
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // 按 Enter 键发送消息
    event.preventDefault() // 阻止默认换行行为
    if (inputValue.value.trim()) {
      // 触发发送消息事件
      emit('send', inputValue.value)
      // 直接清空输入框
      inputValue.value = ''
      emit('update:modelValue', '')
    }
  }
  // Shift+Enter 键默认行为（换行），无需处理
}

// ==================== 暴露方法给父组件 ====================

/**
 * 聚焦到输入框
 * @description 使输入框获得焦点
 */
const focus = () => {
  inputRef.value?.focus()
}

/**
 * 清空输入框内容
 * @description 清空输入框并触发 update:modelValue 事件
 */
const clear = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
}

/**
 * 获取输入框内容
 * @returns 当前输入框的内容字符串
 */
const getValue = (): string => {
  return inputValue.value
}

// 暴露方法
defineExpose({
  focus,
  clear,
  getValue
})
</script>

<template>
  <div 
    v-if="isValidTheme" 
    class="input-box" 
    :class="`theme-${theme}`" 
    :style="{ width, height }"
  >
    <!-- 文本输入区域 -->
    <textarea
      ref="inputRef"
      class="textarea"
      :placeholder="placeholder"
      :value="inputValue"
      @input="handleInput"
      @keydown="handleKeyDown"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
/* ==================== 容器基础样式 ==================== */
.input-box {
  position: relative;
}

/* ==================== 主题样式 ==================== */
.theme-dark {
  background-color: #1a1a2e;
}

/* ==================== 文本输入框样式 ==================== */
.textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  background-color: #2d2d44;
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: inherit;
}

/* 输入框聚焦样式 */
.textarea:focus {
  outline: none;
  background-color: #3d3d54;
  box-shadow: 0 0 0 2px rgba(74, 74, 106, 0.5);
}

/* 输入框占位符样式 */
.textarea::placeholder {
  color: #888;
}

/* ==================== 滚动条样式 ==================== */
.textarea::-webkit-scrollbar {
  width: 6px;
}

.textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.textarea::-webkit-scrollbar-thumb {
  background: rgba(136, 136, 136, 0.5);
  border-radius: 3px;
}

.textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(136, 136, 136, 0.8);
}
</style>
