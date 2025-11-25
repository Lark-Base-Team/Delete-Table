// useTotals：管理表记录总数的懒加载与筛选补齐
// 参数：
// - filteredIds：当前搜索结果的所有表 ID（用于在筛选启用时补齐未缓存总数）
// - pagedIds：当前分页可见的表 ID（用于日常懒加载）
// - filterActive：是否启用总数筛选（当启用时，对 filteredIds 做补齐）
import { useEffect, useRef, useState } from 'react'
import { bitable } from '@lark-base-open/js-sdk'

/**
 * 管理表记录总数的懒加载与筛选补齐
 * @function useTotals
 * @param {string[]} filteredIds 当前搜索结果的所有表 ID（用于在筛选启用时补齐未缓存总数）
 * @param {string[]} pagedIds 当前分页可见的表 ID（用于日常懒加载）
 * @param {boolean} filterActive 是否启用总数筛选
 * @returns {{ totals: Record<string, number>, resetTotals: () => void }}
 */
export function useTotals(filteredIds: string[], pagedIds: string[], filterActive: boolean) {
  const [totals, setTotals] = useState<Record<string, number>>({})
  const subsRef = useRef<Record<string, { add?: () => void; del?: () => void }>>({})

  useEffect(() => {
    // 对分页可见的 ID 懒加载总数
    const ids = pagedIds.filter(id => !(id in totals))
    if (!ids.length) return
    Promise.all(ids.map(async (id) => {
      try {
        const table = await bitable.base.getTableById(id)
        const res = await table.getRecordIdListByPage({ pageSize: 1 })
        return { id, total: res.total }
      } catch {
        return { id, total: NaN }
      }
    })).then(list => {
      setTotals(prev => {
        const next = { ...prev }
        for (const { id, total } of list) next[id] = total
        return next
      })
    })
  }, [pagedIds, totals])

  useEffect(() => {
    if (!filterActive) return
    // 当总数筛选启用时，对搜索结果中的未缓存 ID 补齐总数
    const ids = filteredIds.filter(id => !(id in totals))
    if (!ids.length) return
    Promise.all(ids.map(async (id) => {
      try {
        const table = await bitable.base.getTableById(id)
        const res = await table.getRecordIdListByPage({ pageSize: 1 })
        return { id, total: res.total }
      } catch {
        return { id, total: NaN }
      }
    })).then(list => {
      setTotals(prev => {
        const next = { ...prev }
        for (const { id, total } of list) next[id] = total
        return next
      })
    })
  }, [filteredIds, filterActive, totals])

  useEffect(() => {
    const activeIds = Array.from(new Set([...filteredIds, ...pagedIds]))
    activeIds.forEach(async (id) => {
      if (subsRef.current[id]) return
      try {
        const table = await bitable.base.getTableById(id)
        const addUnsub = table.onRecordAdd(() => {
          setTotals(prev => ({ ...prev, [id]: typeof prev[id] === 'number' ? prev[id] + 1 : prev[id] }))
        })
        const delUnsub = table.onRecordDelete(() => {
          setTotals(prev => ({ ...prev, [id]: typeof prev[id] === 'number' ? Math.max(0, prev[id] - 1) : prev[id] }))
        })
        subsRef.current[id] = { add: addUnsub, del: delUnsub }
      } catch {}
    })
    const toRemove = Object.keys(subsRef.current).filter(id => !activeIds.includes(id))
    toRemove.forEach(id => {
      subsRef.current[id]?.add?.()
      subsRef.current[id]?.del?.()
      delete subsRef.current[id]
    })
    return () => {
      Object.keys(subsRef.current).forEach(id => {
        subsRef.current[id]?.add?.()
        subsRef.current[id]?.del?.()
        delete subsRef.current[id]
      })
    }
  }, [filteredIds, pagedIds])

  // 重置总数缓存
  /** 重置总数缓存 */
  const resetTotals = () => setTotals({})

  return { totals, resetTotals }
}
