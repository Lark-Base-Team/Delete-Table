// 过滤工具：搜索与总数相关的纯函数
import { ITableMeta } from '@lark-base-open/js-sdk'

/**
 * 按名称或 ID 模糊搜索过滤
 * @param {ITableMeta[]} list 表元数据列表
 * @param {string} searchText 搜索关键字
 * @returns {ITableMeta[]} 过滤后的列表
 */
export function filterBySearch(list: ITableMeta[], searchText: string) {
  const s = searchText.trim().toLowerCase()
  if (!s) return list
  return list.filter(m => (m.name || '').toLowerCase().includes(s) || (m.id || '').toLowerCase().includes(s))
}

/**
 * 构造总数比较谓词
 * @param {'eq'|'ne'|'gt'|'ge'|'lt'|'le'|''} op 操作符
 * @param {number|undefined} value 比较值
 * @returns {(n: number) => boolean} 比较函数
 */
export function makeTotalPredicate(op: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | '', value?: number) {
  if (!op || value === undefined || Number.isNaN(value)) return (n: number) => true
  const v = value
  switch (op) {
    case 'eq': return (n: number) => n === v
    case 'ne': return (n: number) => n !== v
    case 'gt': return (n: number) => n > v
    case 'ge': return (n: number) => n >= v
    case 'lt': return (n: number) => n < v
    case 'le': return (n: number) => n <= v
    default: return (n: number) => true
  }
}

/**
 * 基于总数缓存与比较谓词过滤
 * @param {ITableMeta[]} list 列表
 * @param {Record<string, number>} totals 总数映射（表 ID → 总数）
 * @param {(n: number) => boolean} predicate 总数比较函数
 * @returns {ITableMeta[]} 过滤后的列表
 */
export function filterByTotal(list: ITableMeta[], totals: Record<string, number>, predicate: (n: number) => boolean) {
  return list.filter(m => {
    const v = totals[m.id]
    return typeof v === 'number' && predicate(v)
  })
}
