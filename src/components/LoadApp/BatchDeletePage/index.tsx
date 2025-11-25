// 批量删除页：提供表多选下拉与删除按钮
import { Button, Select } from 'antd'
import i18n from '../../../locales/i18n'

/**
 * @typedef BatchDeleteOption
 * @property {string} value 表 ID
 * @property {string} label 表名称
 */
type Option = { value: string, label: string }

/**
 * @typedef BatchDeletePageProps
 * @property {Option[]} options 表下拉选项
 * @property {string[]} selectedIds 已选择的表 ID
 * @property {(ids: string[]) => void} onChange 选择变更回调
 * @property {() => void} onDelete 执行删除回调
 * @property {boolean} loading 是否加载中
 * @property {boolean} disabled 是否禁用交互
 */
type Props = {
  options: Option[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onDelete: () => void
  loading: boolean
  disabled: boolean
}

/**
 * 批量删除页：提供表多选下拉与删除按钮
 * @component
 * @param {Props} props 组件入参
 */
export default function BatchDeletePage({ options, selectedIds, onChange, onDelete, loading, disabled }: Props) {
  const t = i18n.t.bind(i18n)
  const filterOption = (input: string, option?: { label?: string }) => {
    const s = option?.label || ''
    return s.toLowerCase().includes(input.toLowerCase())
  }
  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Select
          mode='multiple'
          value={selectedIds}
          onChange={(ids) => onChange(ids as string[])}
          options={options}
          loading={loading}
          disabled={disabled}
          style={{ width: '100%' }}
          placeholder={options.length === 0 ? t('batch.placeholder.empty') : t('batch.placeholder.select')}
          showSearch
          filterOption={filterOption}
          allowClear
        />
        <Button danger type='primary' disabled={disabled || selectedIds.length === 0} onClick={onDelete}>
          {t('batch.deleteSelected')}
        </Button>
      </div>
    </div>
  )
}
