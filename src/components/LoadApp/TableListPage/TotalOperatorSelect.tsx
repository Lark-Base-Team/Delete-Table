// 总数筛选的操作符下拉选择
import { Select } from 'antd'
import i18n from '../../../locales/i18n'

/**
 * @typedef TotalOperatorSelectProps
 * @property {'eq'|'ne'|'gt'|'ge'|'lt'|'le'|''} value 当前操作符
 * @property {(v: 'eq'|'ne'|'gt'|'ge'|'lt'|'le'|'') => void} onChange 操作符变更回调
 */
type Props = {
  value: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | ''
  onChange: (v: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | '') => void
}

/**
 * 总数操作符选择器
 * @component
 * @param {Props} props 组件入参
 */
export default function TotalOperatorSelect({ value, onChange }: Props) {
  const t = i18n.t.bind(i18n)
  return (
    <Select
      value={value}
      onChange={(op) => onChange(op as any)}
      style={{ height: 40, width: '100%' }}
      dropdownMatchSelectWidth={false}
      options={[
        { value: 'eq', label: t('operator.eq') },
        { value: 'ne', label: t('operator.ne') },
        { value: 'gt', label: t('operator.gt') },
        { value: 'ge', label: t('operator.ge') },
        { value: 'lt', label: t('operator.lt') },
        { value: 'le', label: t('operator.le') },
      ]}
    />
  )
}
