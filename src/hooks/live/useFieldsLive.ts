import { useEffect, useState } from 'react'
import { bitable, IFieldMeta } from '@lark-base-open/js-sdk'

/**
 * 订阅并读取指定表的字段元数据列表
 * @function useFieldsLive
 * @param {string} tableId 表 ID
 * @returns {{ fields: IFieldMeta[] }} 字段列表
 */
export function useFieldsLive(tableId: string) {
  const [fields, setFields] = useState<IFieldMeta[]>([])

  useEffect(() => {
    let unsubAdd: (() => void) | null = null
    let unsubDelete: (() => void) | null = null
    let unsubModify: (() => void) | null = null
    let mounted = true
    const refresh = async () => {
      try {
        const table = await bitable.base.getTableById(tableId)
        const list = await table.getFieldMetaList()
        if (mounted) setFields(list)
      } catch {}
    }
    const setup = async () => {
      await refresh()
      try {
        const table = await bitable.base.getTableById(tableId)
        unsubAdd = table.onFieldAdd(() => { refresh() })
        unsubDelete = table.onFieldDelete(() => { refresh() })
        unsubModify = table.onFieldModify(() => { refresh() })
      } catch {}
    }
    setup()
    return () => {
      mounted = false
      unsubAdd?.()
      unsubDelete?.()
      unsubModify?.()
    }
  }, [tableId])

  return { fields }
}
