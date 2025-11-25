// useThemeClass：读取并订阅 Bitable 主题，返回容器类名
// - 暗色返回 'theme-dark'，否则返回空字符串
import { useEffect, useState } from 'react'
import { bitable } from '@lark-base-open/js-sdk'

/**
 * 读取并订阅 Bitable 主题，返回容器类名
 * @function useThemeClass
 * @returns {string} 主题类名（暗色为 'theme-dark'，否则为空字符串）
 */
export function useThemeClass() {
  const [cls, setCls] = useState('')
  const apply = (theme?: string) => {
    if (!theme) {
      setCls('')
      return
    }
    const v = theme.toLowerCase()
    setCls(v.includes('dark') ? 'theme-dark' : '')
  }
  useEffect(() => {
    // 初始化设置主题类
    ;(async () => {
      try {
        const t = await (bitable as any)?.bridge?.getTheme?.()
        apply(t)
      } catch {
        apply('')
      }
    })()
    // 订阅主题变化
    ;(bitable as any)?.bridge?.onThemeChange?.((e: any) => {
      apply(typeof e === 'string' ? e : e?.theme)
    })
  }, [])
  return cls
}
