// 表列表表格：三列（名称/ID/总数），总数列读取 totals 映射
import { Table } from 'antd'
import i18n from '../../../locales/i18n'
import { ITableMeta } from '@lark-base-open/js-sdk'

/**
 * @typedef TablesTableProps
 * @property {ITableMeta[]} data 当前分页数据
 * @property {boolean} loading 是否加载中
 * @property {{ current: number, pageSize: number, total: number }} pagination 分页信息
 * @property {(page: number) => void} onPageChange 页码变更回调
 * @property {Record<string, number>} totals 表总数缓存映射
 */
type Props = {
  data: ITableMeta[]
  loading: boolean
  pagination: { current: number, pageSize: number, total: number }
  onPageChange: (page: number) => void
  totals: Record<string, number>
}

/**
 * 表列表表格：三列（名称/ID/总数）
 * @component
 * @param {Props} props 组件入参
 */
export default function TablesTable({ data, loading, pagination, onPageChange, totals }: Props) {
  const t = i18n.t.bind(i18n)
  return (
    <Table
      rowKey='id'
      dataSource={data}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: false,
        onChange: (page) => onPageChange(page)
      }}
      columns={[
        { title: t('table.column.name'), dataIndex: 'name', key: 'name' },
        { title: t('table.column.id'), dataIndex: 'id', key: 'id' },
        { title: t('table.column.total'), dataIndex: 'id', key: 'total', render: (id: string) => {
          const v = totals[id]
          if (Number.isNaN(v)) return t('status.error')
          return typeof v === 'number' ? v : t('status.loading')
        } }
      ]}
    />
  )
}
