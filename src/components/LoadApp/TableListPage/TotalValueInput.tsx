// 总数筛选的数值输入框
import { InputNumber } from 'antd'
import i18n from '../../../locales/i18n'

/**
 * @typedef TotalValueInputProps
 * @property {number|undefined} value 当前总数值
 * @property {(v?: number) => void} onChange 数值变更回调
 */
type Props = {
  value: number | undefined
  onChange: (v?: number) => void
}

/**
 * 总数值输入框
 * @component
 * @param {Props} props 组件入参
 */
export default function TotalValueInput({ value, onChange }: Props) {
  const t = i18n.t.bind(i18n)
  return (
    <InputNumber
      value={value}
      onChange={(val) => onChange(typeof val === 'number' ? val : undefined)}
      placeholder={String(t('filter.total.label'))}
      style={{ height: 40, width: '100%' }}
      min={0}
    />
  )
}
