import { useEffect, useState } from 'react'
import { bitable } from '@lark-base-open/js-sdk'

/**
 * 订阅并维护记录总数（增删事件实时更新）
 * @function useRecordsLive
 * @param {string} tableId 表 ID
 * @returns {{ total: number }} 记录总数
 */
export function useRecordsLive(tableId: string) {
  const [total, setTotal] = useState<number>(NaN)

  useEffect(() => {
    let unsubAdd: (() => void) | null = null
    let unsubDelete: (() => void) | null = null
    let unsubModify: (() => void) | null = null
    let mounted = true
    const setup = async () => {
      try {
        const table = await bitable.base.getTableById(tableId)
        const res = await table.getRecordIdListByPage({ pageSize: 1 })
        if (mounted) setTotal(res.total)
        unsubAdd = table.onRecordAdd(() => {
          setTotal(prev => (typeof prev === 'number' ? prev + 1 : prev))
        })
        unsubDelete = table.onRecordDelete(() => {
          setTotal(prev => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev))
        })
        unsubModify = table.onRecordModify(() => {})
      } catch {
        if (mounted) setTotal(NaN)
      }
    }
    setup()
    return () => {
      mounted = false
      unsubAdd?.()
      unsubDelete?.()
      unsubModify?.()
    }
  }, [tableId])

  return { total }
}
