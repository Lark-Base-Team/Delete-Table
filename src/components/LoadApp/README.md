# LoadApp 模块

## 概述
- 将原有的 `LoadApp` 页面拆分为模块化组件与逻辑 hooks，提升可维护性与扩展性。
- 功能覆盖：表列表展示、搜索与总数筛选、分页、删除筛选结果、批量选择并删除。
- 统一接入 `i18n` 文案与从 Bitable 订阅主题类。

## 目录结构
```
src/components/LoadApp/
  index.tsx                # 模块入口，仅装配 TabsContainer
  TabsContainer.tsx        # 页签容器，聚合列表页与批量删除页
  TableListPage/
    FilterBar.tsx          # 列表页筛选工具栏（搜索/总数筛选/操作按钮）
    TablesTable.tsx        # 三列表格（名称/ID/总数）
    TotalOperatorSelect.tsx# 总数操作符下拉
    TotalValueInput.tsx    # 总数值输入框
  BatchDeletePage/
    index.tsx              # 批量删除页（多选下拉+删除）
  hooks/
    useTables.ts           # 表列表加载与批量删除逻辑
    useTotals.ts           # 总数懒加载与筛选启用时补齐缓存
    useThemeClass.ts       # 订阅 Bitable 主题，返回容器类
  utils/
    filters.ts             # 搜索与总数筛选的纯函数
  style.css                # 模块样式（粘性工具栏 + 响应式）
```

## 组件与 Props
- `TabsContainer`
  - 管理筛选（`searchText/totalOp/totalValue`）、分页（`current/pageSize`）、选择的待删除 ID。
  - 组合 `FilterBar + TablesTable` 与 `BatchDeletePage`。

- `FilterBar`
  - `searchText`、`onSearchChange`：搜索关键字及更新回调
  - `totalOp`、`onTotalOpChange`：总数操作符（`eq|ne|gt|ge|lt|le|''`）及更新回调
  - `totalValue`、`onTotalValueChange`：总数值及更新回调
  - `onResetFilters`、`onDeleteFiltered`、`deleting`、`disabled`

- `TablesTable`
  - `data`、`loading`、`pagination({ current/pageSize/total })`、`onPageChange`
  - `totals`：总数缓存映射，第三列根据此映射渲染“总数/错误/加载中”

- `BatchDeletePage`
  - `options`（表下拉列表）、`selectedIds`、`onChange`、`onDelete`、`loading`、`disabled`

## Hooks 与工具
- `useTables`
  - `refreshTables()`：拉取表列表并处理错误提示
  - `deleteTables(ids: string[])`：权限校验→并发删除→结果统计提示→刷新列表
  - 返回：`{ tableMetaList, tablesLoading, deleting, deleteTables, tableOptions, refreshTables }`

- `useTotals`
  - 输入：`filteredIds`（搜索结果 ID 列表）、`pagedIds`（当前页可见 ID）、`filterActive`（是否启用总数筛选）
  - 返回：`{ totals, resetTotals }`
  - 行为：分页懒加载总数；当启用总数筛选时，对搜索结果补齐未缓存总数。

- `useThemeClass`
  - 从 `bitable.bridge.getTheme()` 获取初始主题并订阅 `onThemeChange`，返回 `'theme-dark' | ''`。

- `filters.ts`
  - `filterBySearch(list, text)`：名称/ID 模糊搜索
  - `makeTotalPredicate(op, value)`：构造总数比较谓词
  - `filterByTotal(list, totals, predicate)`：基于总数映射与谓词进行过滤

## 国际化与主题
- 文案使用 `i18n.t`，资源在 `src/locales/{zh.json,en.json}`，并含确认弹窗与 Toast 文案键。
- 容器类由 `useThemeClass` 提供，用于 `.theme-dark .toolbarSticky` 的暗色背景变量。

## 使用方式
1. 在入口已载入 `./locales/i18n`，无需额外初始化。
2. 在页面使用 `<LoadApp />` 即可渲染模块；模块内部处理所有交互与数据拉取。

## 错误与异常处理
- 表列表加载失败、删除失败、无权限、总数拉取失败通过 Toast 或表格内文案提示。
- 删除操作前均弹出确认弹窗；成功/失败计数将以 Toast 呈现。

## 扩展建议
- 在 `FilterBar` 中新增更多筛选条件（如区间 total、isSync、视图可见数）只需追加控件行并在 `filters.ts` 中补充函数。
- 为控件补充可访问性属性（`aria-*`）与键盘导航支持。
- 统一间距与主题 token、完善空态/错误态显示与危险操作的二次确认。

## 维护说明
- 注释使用 JSDoc 风格，为组件、hooks 与工具函数提供可读的接口与行为描述。
- 修改逻辑时，优先在 hooks 与 utils 中实现，以保持视图组件的纯渲染职责。

