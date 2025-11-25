/**
 * FilterBar 列表页筛选工具栏
 * - 搜索输入：按名称或 ID 模糊匹配
 * - 总数筛选：操作符下拉 + 数值输入
 * - 操作按钮：删除筛选结果 / 重置筛选
 */
import { Button, Input } from 'antd'
import i18n from '../../../locales/i18n'
import TotalOperatorSelect from './TotalOperatorSelect'
import TotalValueInput from './TotalValueInput'

/**
 * @typedef FilterBarProps
 * @property {string} searchText 搜索关键字
 * @property {(v: string) => void} onSearchChange 更新搜索关键字
 * @property {'eq'|'ne'|'gt'|'ge'|'lt'|'le'|''} totalOp 总数操作符
 * @property {(op: 'eq'|'ne'|'gt'|'ge'|'lt'|'le'|'') => void} onTotalOpChange 更新总数操作符
 * @property {number|undefined} totalValue 总数数值
 * @property {(v?: number) => void} onTotalValueChange 更新总数数值
 * @property {() => void} onResetFilters 重置筛选
 * @property {() => void} onDeleteFiltered 删除筛选结果
 * @property {boolean} deleting 是否删除中
 * @property {boolean} disabled 是否禁用交互
 */
type Props = {
  searchText: string
  onSearchChange: (v: string) => void
  totalOp: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | ''
  onTotalOpChange: (op: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | '') => void
  totalValue: number | undefined
  onTotalValueChange: (v?: number) => void
  onResetFilters: () => void
  onDeleteFiltered: () => void
  deleting: boolean
  disabled: boolean
}

/**
 * @component FilterBar
 * @param {Props} props 组件入参
 */
export default function FilterBar(props: Props) {
  const t = i18n.t.bind(i18n)
  const { searchText, onSearchChange, totalOp, onTotalOpChange, totalValue, onTotalValueChange, onResetFilters, onDeleteFiltered, deleting, disabled } = props
  return (
    <div>
      {/* 搜索行 */}
      <div className='filterRow'>
        <div className='filterItem'>
          <Input
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
            placeholder={String(t('filter.search.placeholder'))}
            style={{ height: 40 }}
          />
        </div>
      </div>
      {/* 总数筛选行 */}
      <div className='filterRow'>
        <div className='filterItemSmall' style={{ width: 200 }}>
          <TotalOperatorSelect value={totalOp} onChange={onTotalOpChange} />
        </div>
        <div className='filterItemSmall' style={{ width: 200 }}>
          <TotalValueInput value={totalValue} onChange={onTotalValueChange} />
        </div>
      </div>
      {/* 操作按钮行 */}
      <div className='filterRow actionsRow'>
        <div className='filterActions'>
          <Button danger type='primary' disabled={deleting || disabled} onClick={onDeleteFiltered}>
            {t('action.deleteFiltered')}
          </Button>
          <Button onClick={onResetFilters}>
            {t('filter.reset')}
          </Button>
        </div>
      </div>
    </div>
  )
}
