import { useMemo, useState } from 'react'
import { Tabs, Modal } from 'antd'
// 页签容器：聚合“列表页”和“批量删除”两页
// - 管理筛选（搜索/总数操作符与数值）、分页、选择的待删除 ID
// - 复用 hooks：useTables（表列表与删除）、useTotals（总数懒加载）、useThemeClass（主题类）
import i18n from '../../locales/i18n'
import { ITableMeta } from '@lark-base-open/js-sdk'
import { useTables } from './hooks/useTables'
import { useThemeClass } from './hooks/useThemeClass'
import { useTotals } from './hooks/useTotals'
import { filterBySearch, makeTotalPredicate, filterByTotal } from './utils/filters'
import FilterBar from './TableListPage/FilterBar'
import BatchDeletePage from './BatchDeletePage'
import TablesTable from './TableListPage/TablesTable'
import TotalOperatorSelect from './TableListPage/TotalOperatorSelect'
import TotalValueInput from './TableListPage/TotalValueInput'
import './style.css'

/**
 * TabsContainer 页签容器
 * @component
 * @description 聚合“列表页”和“批量删除”两页；管理筛选（搜索/总数）、分页、选择的待删除 ID，以及总数缓存与主题类。
 */
export default function TabsContainer() {
  const t = i18n.t.bind(i18n)
  const themeClass = useThemeClass()
  const { tableMetaList, tablesLoading, deleting, deleteTables, tableOptions, refreshTables } = useTables()
  const [activeKey, setActiveKey] = useState('list')
  const [searchText, setSearchText] = useState('')
  const [totalOp, setTotalOp] = useState<'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | ''>('eq')
  const [totalValue, setTotalValue] = useState<number | undefined>(undefined)
  const [pageSize] = useState(10)
  const [current, setCurrent] = useState(1)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([])

  // 搜索筛选
  /**
   * 搜索筛选后的列表
   */
  const filtered = useMemo(() => filterBySearch(tableMetaList, searchText), [tableMetaList, searchText])

  // 总数谓词（根据操作符与数值生成）
  /**
   * 根据操作符与数值生成的总数比较谓词
   */
  const totalPredicate = useMemo(() => makeTotalPredicate(totalOp, totalValue), [totalOp, totalValue])

  const filterActive = !!(totalOp && totalValue !== undefined && !Number.isNaN(totalValue))
  // 当前搜索结果的“分页可见 ID”，用于懒加载总数
  /**
   * 当前页可见的搜索结果 ID（用于懒加载总数）
   */
  const pagedSearchIds = useMemo(() => {
    const start = (current - 1) * pageSize
    return filtered.slice(start, start + pageSize).map(m => m.id)
  }, [filtered, current, pageSize])
  // 总数缓存管理：分页懒加载 + 在筛选条件激活时补齐未缓存总数
  const { totals, resetTotals } = useTotals(
    filtered.map(m => m.id),
    pagedSearchIds,
    filterActive
  )
  // 若启用总数筛选，则基于 totals 与谓词二次过滤
  /**
   * 若启用总数筛选，则对搜索结果进行二次过滤
   */
  const filteredByTotal = useMemo(() => filterActive ? filterByTotal(filtered, totals, totalPredicate) : filtered, [filtered, totals, totalPredicate, filterActive])

  // 用于展示的分页数据
  /**
   * 最终用于展示的分页数据
   */
  const pagedData = useMemo(() => {
    const start = (current - 1) * pageSize
    return filteredByTotal.slice(start, start + pageSize)
  }, [filteredByTotal, current, pageSize])

  

  // 删除当前筛选出的所有数据表（弹窗确认）
  /**
   * 删除当前筛选出的所有数据表（弹窗确认）
   */
  const onDeleteFiltered = () => {
    const ids = filteredByTotal.map(m => m.id)
    if (!ids.length) return
    const names = filteredByTotal.map(m => m.name || m.id)
    Modal.confirm({
      title: t('confirm.delete.filtered.title'),
      content: names.join(', '),
      okText: t('confirm.ok'),
      cancelText: t('confirm.cancel'),
      onOk: async () => {
        await deleteTables(ids)
        setCurrent(1)
      }
    })
  }

  // 重置筛选与分页，并清空总数缓存
  /**
   * 重置筛选与分页，并清空总数缓存
   */
  const onResetFilters = () => {
    setSearchText('')
    setTotalOp('')
    setTotalValue(undefined)
    setCurrent(1)
    resetTotals()
  }

  // 删除所选 ID（弹窗确认），完成后刷新表列表
  /**
   * 删除所选 ID（弹窗确认），完成后刷新表列表
   */
  const onDeleteSelected = () => {
    if (!selectedDeleteIds.length) return
    const names = selectedDeleteIds.map(id => tableMetaList.find(m => m.id === id)?.name || id)
    Modal.confirm({
      title: t('confirm.delete.title'),
      content: names.join(', '),
      okText: t('confirm.ok'),
      cancelText: t('confirm.cancel'),
      onOk: async () => {
        await deleteTables(selectedDeleteIds)
        setSelectedDeleteIds([])
        refreshTables()
      }
    })
  }

  return (
    <div className={themeClass}>
      {/* 页签切换：列表页 / 批量删除页 */}
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={[
        {
          key: 'list',
          label: t('tab.tableList'),
          children: (
            <div className='pageContainer'>
              <div className='toolbarSticky'>
                {/* 列表页筛选工具栏 */}
                <FilterBar
                  searchText={searchText}
                  onSearchChange={(v) => { setSearchText(v); setCurrent(1) }}
                  totalOp={totalOp}
                  onTotalOpChange={(op) => { setTotalOp(op as any); setCurrent(1) }}
                  totalValue={totalValue}
                  onTotalValueChange={(val) => { setTotalValue(typeof val === 'number' ? val : undefined); setCurrent(1) }}
                  onResetFilters={onResetFilters}
                  onDeleteFiltered={onDeleteFiltered}
                  deleting={deleting}
                  disabled={deleting || tablesLoading}
                />
              </div>
              {/* 列表表格 */}
              <TablesTable
                data={pagedData as ITableMeta[]}
                loading={tablesLoading}
                pagination={{ current, pageSize, total: filteredByTotal.length }}
                onPageChange={(page) => setCurrent(page)}
                totals={totals}
              />
            </div>
          )
        },
        {
          key: 'delete',
          label: t('tab.batchDelete'),
          children: (
            // 批量删除页：选择表并执行删除
            <BatchDeletePage
              options={tableOptions}
              selectedIds={selectedDeleteIds}
              onChange={(ids) => setSelectedDeleteIds(ids)}
              onDelete={onDeleteSelected}
              loading={tablesLoading}
              disabled={deleting || tablesLoading || tableOptions.length === 0}
            />
          )
        }
      ]} />
    </div>
  )
}
