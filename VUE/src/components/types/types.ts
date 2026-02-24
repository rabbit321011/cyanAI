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
