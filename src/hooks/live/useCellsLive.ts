import { useEffect, useState } from 'react'
import { bitable, IOpenCellValue } from '@lark-base-open/js-sdk'

/**
 * 订阅并读取指定单元格值的实时更新
 * @function useCellsLive
 * @param {string} tableId 表 ID
 * @param {string} recordId 记录 ID
 * @param {string} fieldId 字段 ID
 * @returns {{ value: IOpenCellValue }} 单元格值
 */
export function useCellsLive(tableId: string, recordId: string, fieldId: string) {
  const [value, setValue] = useState<IOpenCellValue>(null)

  useEffect(() => {
    let unsubModify: (() => void) | null = null
    let mounted = true
    const refresh = async () => {
      try {
        const table = await bitable.base.getTableById(tableId)
        const v = await table.getCellValue(fieldId, recordId)
        if (mounted) setValue(v)
      } catch {}
    }
    const setup = async () => {
      await refresh()
      try {
        const table = await bitable.base.getTableById(tableId)
        unsubModify = table.onRecordModify(ev => {
          const changed = ev.data
          if (changed.recordId === recordId && changed.fieldIds.includes(fieldId)) refresh()
        })
      } catch {}
    }
    setup()
    return () => {
      mounted = false
      unsubModify?.()
    }
  }, [tableId, recordId, fieldId])

  return { value }
}
