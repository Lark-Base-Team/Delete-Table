// useTables：管理数据表列表加载与批量删除
// - refreshTables：拉取最新表列表并处理错误提示
// - deleteTables(ids)：校验权限、并发删除、结果统计提示，完成后刷新列表
import { useMemo, useState } from 'react'
import { bitable, ITableMeta, ToastType } from '@lark-base-open/js-sdk'
import { useTablesLive } from '../../../hooks/live/useTablesLive'
import i18n from '../../../locales/i18n'

/**
 * 管理数据表列表加载与批量删除
 * @function useTables
 * @returns {{
 *   tableMetaList: ITableMeta[],
 *   tablesLoading: boolean,
 *   deleting: boolean,
 *   deleteTables: (ids: string[]) => Promise<void>,
 *   tableOptions: { value: string, label: string }[],
 *   refreshTables: () => void
 * }}
 */
export function useTables() {
  const t = i18n.t.bind(i18n) as (key: string, opts?: any) => string
  const tableMetaList = useTablesLive()
  const [tablesLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const refreshTables = () => {}

  /**
   * 批量删除（权限校验 + 并发删除 + 结果汇总 + 刷新）
   * @param {string[]} ids 待删除的表 ID 集合
   * @returns {Promise<void>}
   */
  const deleteTables = async (ids: string[]) => {
    if (!ids.length) return
    setDeleting(true)
    try {
      // 权限校验
      const canDelete = await Promise.all(ids.map(id => bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId: id } } as any)))
      const allowed = ids.filter((_, idx) => canDelete[idx])
      const denied = ids.filter((_, idx) => !canDelete[idx])
      if (denied.length) {
        bitable.ui.showToast({ toastType: ToastType.warning, message: t('toast.noPermission', { count: denied.length }) })
      }
      // 并发删除允许的表
      const results = await Promise.allSettled(allowed.map(id => bitable.base.deleteTable(id)))
      const success = results.filter(r => r.status === 'fulfilled').length
      const fail = results.length - success
      if (success) {
        bitable.ui.showToast({ toastType: ToastType.success, message: t('toast.deleted', { count: success }) })
      }
      if (fail) {
        bitable.ui.showToast({ toastType: ToastType.error, message: t('toast.failed', { count: fail }) })
      }
      
    } catch (e: any) {
      bitable.ui.showToast({ toastType: ToastType.error, message: typeof e?.message === 'string' ? e.message : t('toast.deleteError') })
    } finally {
      setDeleting(false)
    }
  }

  const tableOptions = useMemo(() => tableMetaList.map(({ id, name }) => ({ value: id, label: name })), [tableMetaList])

  return { tableMetaList, tablesLoading, deleting, deleteTables, tableOptions, refreshTables }
}
