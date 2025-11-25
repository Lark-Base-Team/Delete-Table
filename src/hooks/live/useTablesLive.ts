import { useEffect, useSyncExternalStore } from 'react'
import { bitableEventHub } from '../../lib/bitableEventHub'
import { ITableMeta } from '@lark-base-open/js-sdk'

/**
 * 订阅并读取当前 Base 的表元数据列表
 * @function useTablesLive
 * @returns {ITableMeta[]} 表元数据列表
 */
export function useTablesLive(): ITableMeta[] {
  useEffect(() => {
    bitableEventHub.tablesMeta.ensure()
    return () => bitableEventHub.tablesMeta.stop()
  }, [])
  const list = useSyncExternalStore(
    bitableEventHub.tablesMeta.subscribe,
    bitableEventHub.tablesMeta.get,
    bitableEventHub.tablesMeta.get
  )
  return list
}
