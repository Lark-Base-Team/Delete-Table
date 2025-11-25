import { useEffect, useSyncExternalStore } from 'react'
import { bitableEventHub } from '../../lib/bitableEventHub'

/**
 * 订阅并读取当前选区（表/视图/字段/记录）的实时状态
 * @function useSelectionLive
 * @returns {any} 选区状态
 */
export function useSelectionLive() {
  useEffect(() => {
    bitableEventHub.selection.ensure()
    return () => bitableEventHub.selection.stop()
  }, [])
  const selection = useSyncExternalStore(
    bitableEventHub.selection.subscribe,
    bitableEventHub.selection.get,
    bitableEventHub.selection.get
  )
  return selection
}
