import { useEffect, useMemo, useState } from "react"
import './style.css'
import { bitable, ITableMeta, ToastType } from '@lark-base-open/js-sdk'
import { Button, Select, Modal, Tabs, Input, Table, InputNumber } from "antd"

// 仅保留批量删除逻辑，其余功能移除
export default function LoadApp() {
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>([])
  const [lang, setLang] = useState<string>('en')
  const [tablesLoading, setTablesLoading] = useState<boolean>(false)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState<boolean>(false)
  const [activeKey, setActiveKey] = useState<string>('list')
  const [searchText, setSearchText] = useState<string>('')
  const [totalOp, setTotalOp] = useState<'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | ''>('')
  const [totalValue, setTotalValue] = useState<number | undefined>(undefined)
  const [pageSize] = useState<number>(10)
  const [current, setCurrent] = useState<number>(1)

  // 初始化：并发获取表列表与语言
  useEffect(() => {
    setTablesLoading(true)
    Promise.all([bitable.base.getTableMetaList(), bitable.bridge.getLanguage()])
      .then(([metaList, language]) => {
        setTableMetaList(metaList)
        setLang(language)
      })
      .catch((e) => {
        bitable.ui.showToast({ toastType: ToastType.error, message: typeof (e as any)?.message === 'string' ? (e as any).message : (lang.startsWith('zh') ? '表列表加载失败' : 'Load tables failed') })
      })
      .finally(() => setTablesLoading(false))
  }, [])

  const tableOptions = useMemo(() => tableMetaList.map(({ id, name }) => ({ value: id, label: name })), [tableMetaList])
  const filterOption = (input: string, option?: { label?: string }) => {
    const t = option?.label || ''
    return t.toLowerCase().includes(input.toLowerCase())
  }
  const filtered = useMemo(() => {
    const s = searchText.trim().toLowerCase()
    if (!s) return tableMetaList
    return tableMetaList.filter(m => (m.name || '').toLowerCase().includes(s) || (m.id || '').toLowerCase().includes(s))
  }, [tableMetaList, searchText])
  const totalPredicate = useMemo(() => {
    if (!totalOp || totalValue === undefined || Number.isNaN(totalValue)) return (n: number) => true
    const v = totalValue
    switch (totalOp) {
      case 'eq': return (n: number) => n === v
      case 'ne': return (n: number) => n !== v
      case 'gt': return (n: number) => n > v
      case 'ge': return (n: number) => n >= v
      case 'lt': return (n: number) => n < v
      case 'le': return (n: number) => n <= v
      default: return (n: number) => true
    }
  }, [totalOp, totalValue])
  const [totals, setTotals] = useState<Record<string, number>>({})
  const filteredByTotal = useMemo(() => {
    if (!totalOp || totalValue === undefined || Number.isNaN(totalValue)) return filtered
    return filtered.filter(m => {
      const t = totals[m.id]
      return typeof t === 'number' && totalPredicate(t)
    })
  }, [filtered, totalOp, totalValue, totals, totalPredicate])
  const pagedData = useMemo(() => {
    const start = (current - 1) * pageSize
    return filteredByTotal.slice(start, start + pageSize)
  }, [filteredByTotal, current, pageSize])

  useEffect(() => {
    const ids = pagedData.map(m => m.id).filter(id => !(id in totals))
    if (ids.length === 0) return
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
  }, [pagedData, totals])
  useEffect(() => {
    if (!totalOp || totalValue === undefined || Number.isNaN(totalValue)) return
    const ids = filtered.map(m => m.id).filter(id => !(id in totals))
    if (ids.length === 0) return
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
  }, [filtered, totalOp, totalValue, totals])

  // 执行批量删除（权限校验 + 并发删除 + 结果汇总 + 刷新）
  const doDelete = () => {
    if (selectedDeleteIds.length === 0) return
    const names = selectedDeleteIds.map(id => tableMetaList.find(m => m.id === id)?.name || id)
    Modal.confirm({
      title: lang.startsWith('zh') ? '确认删除以下数据表？' : 'Confirm to delete these tables?',
      content: names.join(', '),
      okText: lang.startsWith('zh') ? '删除' : 'Delete',
      cancelText: lang.startsWith('zh') ? '取消' : 'Cancel',
      onOk: async () => {
        setDeleting(true)
        try {
          // 校验是否有删除权限
          const canDelete = await Promise.all(selectedDeleteIds.map(id => bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId: id } } as any)))
          const allowed = selectedDeleteIds.filter((id, idx) => canDelete[idx])
          const denied = selectedDeleteIds.filter((id, idx) => !canDelete[idx])
          if (denied.length) {
            bitable.ui.showToast({ toastType: ToastType.warning, message: lang.startsWith('zh') ? '无删除权限：' + denied.length : 'No delete permission: ' + denied.length })
          }
          // 并发删除允许的表
          const results = await Promise.allSettled(allowed.map(id => bitable.base.deleteTable(id)))
          const successIds: string[] = []
          const failIds: string[] = []
          results.forEach((r, i) => {
            const id = allowed[i]
            if (r.status === 'fulfilled' && r.value) successIds.push(id)
            else failIds.push(id)
          })
          // 汇总提示
          if (successIds.length) {
            bitable.ui.showToast({ toastType: ToastType.success, message: lang.startsWith('zh') ? `删除成功：${successIds.length}` : `Deleted: ${successIds.length}` })
          }
          if (failIds.length) {
            bitable.ui.showToast({ toastType: ToastType.error, message: lang.startsWith('zh') ? `删除失败：${failIds.length}` : `Failed: ${failIds.length}` })
          }
          // 刷新列表并清空选择
          const metaList = await bitable.base.getTableMetaList()
          setTableMetaList(metaList)
          setSelectedDeleteIds([])
        } catch (e: any) {
          bitable.ui.showToast({ toastType: ToastType.error, message: typeof e?.message === 'string' ? e.message : (lang.startsWith('zh') ? '删除异常' : 'Delete error') })
        } finally {
          setDeleting(false)
        }
      }
    })
  }

  const deleteFiltered = () => {
    const ids = filteredByTotal.map(m => m.id)
    if (ids.length === 0) return
    const names = filteredByTotal.map(m => m.name || m.id)
    Modal.confirm({
      title: lang.startsWith('zh') ? '确认删除筛选出的数据表？' : 'Delete filtered tables?',
      content: names.join(', '),
      okText: lang.startsWith('zh') ? '删除' : 'Delete',
      cancelText: lang.startsWith('zh') ? '取消' : 'Cancel',
      onOk: async () => {
        setDeleting(true)
        try {
          const canDelete = await Promise.all(ids.map(id => bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId: id } } as any)))
          const allowed = ids.filter((id, idx) => canDelete[idx])
          const denied = ids.filter((id, idx) => !canDelete[idx])
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
          const metaList = await bitable.base.getTableMetaList()
          setTableMetaList(metaList)
          setCurrent(1)
          setSelectedDeleteIds([])
        } catch (e: any) {
          bitable.ui.showToast({ toastType: ToastType.error, message: typeof e?.message === 'string' ? e.message : (lang.startsWith('zh') ? '删除异常' : 'Delete error') })
        } finally {
          setDeleting(false)
        }
      }
    })
  }

  return (
    <Tabs activeKey={activeKey} onChange={setActiveKey} items={[
      {
        key: 'list',
        label: lang.startsWith('zh') ? '数据表列表展示' : 'Table List',
        children: (
          <div className='pageContainer'>
            <div className='toolbarSticky'>
              <div className='filterRow'>
                <div className='filterItem'>
                  <Input
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); setCurrent(1) }}
                    allowClear
                    placeholder={lang.startsWith('zh') ? '按名称或ID模糊筛选' : 'Filter by name or ID'}
                    style={{ height: 40 }}
                  />
                </div>
              </div>
              <div className='filterRow'>
                <div className='filterItemSmall'>
                  <Select
                    value={totalOp}
                    onChange={(op) => { setTotalOp(op as any); setCurrent(1) }}
                    style={{ height: 40 }}
                    dropdownMatchSelectWidth={false}
                    options={[
                      { value: 'eq', label: lang.startsWith('zh') ? '等于' : 'Equals' },
                      { value: 'ne', label: lang.startsWith('zh') ? '不等于' : 'Not Equals' },
                      { value: 'gt', label: lang.startsWith('zh') ? '大于' : 'Greater Than' },
                      { value: 'ge', label: lang.startsWith('zh') ? '大于或等于' : 'Greater Or Equal' },
                      { value: 'lt', label: lang.startsWith('zh') ? '小于' : 'Less Than' },
                      { value: 'le', label: lang.startsWith('zh') ? '小于或等于' : 'Less Or Equal' },
                    ]}
                  />
                </div>
                <div className='filterItemSmall'>
                  <InputNumber
                    value={totalValue}
                    onChange={(val) => { setTotalValue(typeof val === 'number' ? val : undefined); setCurrent(1) }}
                    placeholder={lang.startsWith('zh') ? '总数' : 'Total'}
                    style={{ height: 40, width: '100%' }}
                    min={0}
                  />
                </div>
              </div>
              <div className='filterRow actionsRow'>
                <div className='filterActions'>
                  <Button danger type='primary' disabled={deleting || filteredByTotal.length === 0} onClick={deleteFiltered}>
                    {lang.startsWith('zh') ? '删除筛选结果' : 'Delete Filtered'}
                  </Button>
                  <Button onClick={() => { setSearchText(''); setTotalOp(''); setTotalValue(undefined); setCurrent(1) }}>
                    {lang.startsWith('zh') ? '重置筛选' : 'Reset Filters'}
                  </Button>
                </div>
              </div>
            </div>
            <Table
              rowKey='id'
              dataSource={pagedData}
              loading={tablesLoading}
              pagination={{
                current,
                pageSize,
                total: filteredByTotal.length,
                showSizeChanger: false,
                onChange: (page) => setCurrent(page)
              }}
              columns={[
                { title: lang.startsWith('zh') ? '名称' : 'Name', dataIndex: 'name', key: 'name' },
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: lang.startsWith('zh') ? '总数' : 'Total', dataIndex: 'id', key: 'total', render: (id: string) => {
                  const t = totals[id]
                  if (Number.isNaN(t)) return lang.startsWith('zh') ? '获取失败' : 'Error'
                  return typeof t === 'number' ? t : '...'
                } }
              ]}
            />
          </div>
        )
      },
      {
        key: 'delete',
        label: lang.startsWith('zh') ? '批量删除数据表' : 'Batch Delete',
        children: (
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select
                mode='multiple'
                value={selectedDeleteIds}
                onChange={(ids) => setSelectedDeleteIds(ids as string[])}
                options={tableOptions}
                loading={tablesLoading}
                disabled={tablesLoading || tableOptions.length === 0}
                style={{ width: '100%' }}
                placeholder={tableOptions.length === 0 ? (lang.startsWith('zh') ? '暂无数据表' : 'No tables') : (lang.startsWith('zh') ? '选择待删除的数据表' : 'Select tables to delete')}
                showSearch
                filterOption={filterOption}
                allowClear
              />
              <Button danger type='primary' disabled={deleting || selectedDeleteIds.length === 0} onClick={doDelete}>
                {lang.startsWith('zh') ? '删除所选' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        )
      }
    ]} />
  )
}
