import { useEffect, useMemo, useState } from 'react'
import { bitable, ITableMeta, ToastType } from '@lark-base-open/js-sdk'
import { useTablesLive } from '../../hooks/live/useTablesLive'
import { useSelectionLive } from '../../hooks/live/useSelectionLive'
import { Select, Button, Modal } from 'antd'

interface TableSelectorProps {
  value?: string
  onChange?: (tableId: string) => void
  switchOnSelect?: boolean
  style?: React.CSSProperties
  placeholder?: string
  deletable?: boolean
  onDeleted?: (result: { successIds: string[]; failIds: string[] }) => void
}

export default function TableSelector(props: TableSelectorProps) {
  const list = useTablesLive()
  const [value, setValue] = useState<string | undefined>(props.value)
  const [loading] = useState<boolean>(false)
  const [lang, setLang] = useState<string>('en')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState<boolean>(false)
  const selection = useSelectionLive()

  useEffect(() => {
    bitable.bridge.getLanguage().then(setLang).catch(() => {})
  }, [])

  useEffect(() => {
    if (!props.value && selection?.tableId) setValue(selection.tableId || undefined)
  }, [selection, props.value])

  useEffect(() => {
    if (props.value !== undefined) setValue(props.value)
  }, [props.value])

  const options = useMemo(() => list.map(({ id, name }) => ({ value: id, label: name })), [list])
  const placeholder = props.placeholder || (lang.startsWith('zh') ? '请选择数据表' : 'Please select a Table')

  const handleChange = async (tableId: string) => {
    setValue(tableId)
    if (props.onChange) props.onChange(tableId)
    if (props.switchOnSelect) {
      try {
        const ok = await bitable.ui.switchToTable(tableId)
        if (!ok) bitable.ui.showToast({ toastType: ToastType.warning, message: lang.startsWith('zh') ? '跳转失败' : 'Switch failed' })
      } catch (e) {
        bitable.ui.showToast({ toastType: ToastType.error, message: typeof (e as any)?.message === 'string' ? (e as any).message : (lang.startsWith('zh') ? '跳转异常' : 'Switch error') })
      }
    }
  }

  const filterOption = (input: string, option?: { label?: string }) => {
    const t = option?.label || ''
    return t.toLowerCase().includes(input.toLowerCase())
  }

  const doDelete = async () => {
    if (selectedIds.length === 0) return
    const names = selectedIds.map(id => list.find(m => m.id === id)?.name || id)
    Modal.confirm({
      title: lang.startsWith('zh') ? '确认删除以下数据表？' : 'Confirm to delete these tables?',
      content: names.join(', '),
      okText: lang.startsWith('zh') ? '删除' : 'Delete',
      cancelText: lang.startsWith('zh') ? '取消' : 'Cancel',
      onOk: async () => {
        setDeleting(true)
        try {
          const canDelete = await Promise.all(selectedIds.map(id => bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId: id } } as any)))
          const allowed = selectedIds.filter((id, idx) => canDelete[idx])
          const denied = selectedIds.filter((id, idx) => !canDelete[idx])

          if (denied.length) {
            bitable.ui.showToast({ toastType: ToastType.warning, message: lang.startsWith('zh') ? '无删除权限：' + denied.length : 'No delete permission: ' + denied.length })
          }

          const results = await Promise.allSettled(allowed.map(id => bitable.base.deleteTable(id)))
          const successIds: string[] = []
          const failIds: string[] = []
          results.forEach((r, i) => {
            const id = allowed[i]
            if (r.status === 'fulfilled' && r.value) successIds.push(id)
            else failIds.push(id)
          })

          if (successIds.length) {
            bitable.ui.showToast({ toastType: ToastType.success, message: lang.startsWith('zh') ? `删除成功：${successIds.length}` : `Deleted: ${successIds.length}` })
          }
          if (failIds.length) {
            bitable.ui.showToast({ toastType: ToastType.error, message: lang.startsWith('zh') ? `删除失败：${failIds.length}` : `Failed: ${failIds.length}` })
          }

          if (props.onDeleted) props.onDeleted({ successIds, failIds })

          setSelectedIds([])

          if (value && successIds.includes(value)) setValue(undefined)
        } catch (e: any) {
          bitable.ui.showToast({ toastType: ToastType.error, message: typeof e?.message === 'string' ? e.message : (lang.startsWith('zh') ? '删除异常' : 'Delete error') })
        } finally {
          setDeleting(false)
        }
      }
    })
  }

  if (props.deletable) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Select
          mode='multiple'
          value={selectedIds}
          onChange={(ids) => setSelectedIds(ids as string[])}
          options={options}
          loading={loading}
          disabled={loading || options.length === 0}
          style={props.style}
          placeholder={options.length === 0 ? (lang.startsWith('zh') ? '暂无数据表' : 'No tables') : (lang.startsWith('zh') ? '选择待删除的数据表' : 'Select tables to delete')}
          showSearch
          filterOption={filterOption}
          allowClear
        />
        <Button danger type='primary' onClick={doDelete} disabled={deleting || selectedIds.length === 0}>
          {lang.startsWith('zh') ? '删除所选' : 'Delete Selected'}123
        </Button>
      </div>
    )
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      options={options}
      loading={loading}
      disabled={loading || options.length === 0}
      style={props.style}
      placeholder={options.length === 0 ? (lang.startsWith('zh') ? '暂无数据表' : 'No tables') : placeholder}
      showSearch
      filterOption={filterOption}
      allowClear
    />
  )
}
