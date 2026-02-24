<script setup lang="ts">
import { ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import ContextShow from './components/ContextShow.vue'
import InputBox from './components/InputBox.vue'
import type {MessageItem} from './components/types/types'
import {commandMessage,creatUserMessage, sendMessage} from "./components/webOperation"
import { isError } from './components/utility/isError'
// 从全局状态管理文件导入 userName
import {userName} from './components/store/globalState'
/**
 * 获取浏览器窗口尺寸
 * @description 使用 @vueuse/core 的 useWindowSize 响应式获取窗口宽高
 */
const { width, height } = useWindowSize()

/**
 * ContextShow 组件的引用
 * @description 用于调用组件暴露的方法：setContext() 和 addMessage()
 * @note 在模板中通过 ref 属性使用，TypeScript 可能误报未使用
 */
const contextShowRef = ref<InstanceType<typeof ContextShow> | null>(null)

/**
 * InputBox 组件的引用
 * @description 用于调用组件暴露的方法：clear() 等
 */
const inputBoxRef = ref<InstanceType<typeof InputBox> | null>(null)
async function inputBoxSend(inputBoxText:string){
  const temp_data:string = commandMessage(inputBoxText)
  if(isError(temp_data))
  {
    //这不是命令，那么就不管temp_data这玩意
    //显示信息到自己框里
    contextShowRef.value?.addMessage(creatUserMessage(inputBoxText))
    //发送这玩意给服务器先
    let sendMessageResponse = await sendMessage(inputBoxText)
    //把结果添加一下
    //但是先拆分
    let sendMessageResponseArray:string[] = sendMessageResponse.split('@br');
    sendMessageResponseArray.map((curr)=>{
        if(curr !== "<empty_reply>")
        contextShowRef.value?.addMessage({
        icon:'/img/header/cyanAI.jpg',
        current:curr,
        speaker:"cyanAI",
        currentFrom:'raw'
      })
    })
    
    //完成了
  }else{
    //成功执行了命令，那么就只把消息添加到显示，不传服务器
    contextShowRef.value?.addMessage(creatUserMessage(inputBoxText));
    //再显示执行结果
    contextShowRef.value?.addMessage({
      icon:null,
      current:temp_data,
      speaker:"commandResponse",
      currentFrom:'raw'
    });
    //然后就没事了
  }
}
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
      :height="`${height * 0.8}px`" 
    />
    
    <!-- 
      InputBox 组件：输入框组件
      - theme: 主题，与 ContextShow 保持一致
      - width: 组件宽度，使用浏览器窗口宽度
      - height: 固定高度 120px
    -->
    <div class="input-container">
      <InputBox 
        ref="inputBoxRef"
        theme="dark" 
        :width="`${width}px`" 
        :height="`${height * 0.2}px`"
        @send="async (value) => {
          await inputBoxSend(value)
        }"
      />
    </div>
  </div>
</template>

<style scoped>
/**
 * 应用容器样式
 * @description 占满整个浏览器视口，使用 flex 布局
 */
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/**
 * 输入框容器样式
 * @description 包裹 InputBox 组件
 */
.input-container {
  flex-shrink: 0;
}
</style>