import { useEffect, useState } from 'react'
import { bitable, IViewMeta } from '@lark-base-open/js-sdk'

/**
 * 轮询读取视图元数据并获取当前激活视图
 * @function useViewsLive
 * @param {string} tableId 表 ID
 * @returns {{ views: IViewMeta[], activeViewId: (string|undefined) }} 视图列表与激活视图 ID
 */
export function useViewsLive(tableId: string) {
  const [views, setViews] = useState<IViewMeta[]>([])
  const [activeViewId, setActiveViewId] = useState<string | undefined>(undefined)

  useEffect(() => {
    let timer: any = null
    let mounted = true
    const fetchOnce = async () => {
      try {
        const table = await bitable.base.getTableById(tableId)
        const list = await table.getViewMetaList()
        if (mounted) setViews(list)
        const active = await table.getActiveView()
        if (mounted) setActiveViewId(active?.id)
      } catch {}
    }
    fetchOnce()
    timer = setInterval(fetchOnce, 1000)
    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [tableId])

  return { views, activeViewId }
}
