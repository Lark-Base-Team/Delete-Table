## 目标

* 将 `src/components/LoadApp/index.tsx` 拆分为清晰的模块，提升可维护性、可测试性与后续扩展（发布到插件中心规范）。

## 拆分方案

* 视图层组件

  * `TabsContainer`：负责页签切换与承载两个功能页

  * `TableListPage`：数据表列表展示页（筛选、分页、表格）

  * `BatchDeletePage`：批量删除页（多选下拉+删除）

* 子组件

  * `FilterBar`：分行展示筛选控件（搜索行、总数操作符行、操作按钮行）

  * `TotalOperatorSelect`：总数操作符下拉（支持 dropdown 自适应）

  * `TotalValueInput`：总数数值输入

  * `TablesTable`：三列表格（Name/ID/Total）

* 逻辑与数据

  * `useTables`：获取/刷新表列表、语言、权限校验、删除操作（并发、统计、提示）

  * `useTotals`：分页按需加载 `total` 缓存与过滤谓词生成

  * `filters.ts`：筛选组合与分页联动工具（重置筛选、重置分页）

* 主题与国际化

  * `useThemeClass`：订阅 `bitable.bridge.getTheme()` + `onThemeChange` → 容器类切换

  * 所有文案使用 `react-i18next` 的 `t()`，文案在 `locales/*.json`

## 目录结构

* `src/components/LoadApp/`

  * `index.tsx`（仅拼装 Tabs 与注入 Providers）

  * `TabsContainer.tsx`

  * `TableListPage/FilterBar.tsx`

  * `TableListPage/TablesTable.tsx`

  * `TableListPage/TotalOperatorSelect.tsx`

  * `TableListPage/TotalValueInput.tsx`

  * `BatchDeletePage/index.tsx`

  * `hooks/useTables.ts`

  * `hooks/useTotals.ts`

  * `utils/filters.ts`

  * `style.css`（保留现有类并按模块必要扩充）

## 对外接口（props/state）

* `FilterBar`

  * `searchText`、`onSearchChange`

  * `totalOp`、`onTotalOpChange`

  * `totalValue`、`onTotalValueChange`

  * `onResetFilters`、`onDeleteFiltered`、`deleting`、`disabled`

* `TablesTable`

  * `data`、`loading`、`pagination`（`current/pageSize/total`）

  * `onPageChange`、`columns`（内置第三列 total 的 render，读取 totals 映射）

* `BatchDeletePage`

  * `options`（表下拉列表）、`selectedIds`、`onChange`、`onDelete`、`loading`、`disabled`

## 迁移步骤

1. 抽离文案到 `i18n` 并在 `index.tsx` 引入（若未启用则启用）。
2. 拆出 `useTables` 与 `useTotals`，将删除/权限校验与 total 获取逻辑下沉。
3. 重构 `TableListPage`：引入 `FilterBar + TablesTable`，去除页面内联样式，保留粘性工具栏类。
4. 重构 `BatchDeletePage`：保持逻辑不变，迁移到独立文件并接收 props。
5. 在 `TabsContainer` 内注入 `themeClass` 与 `t()`；`index.tsx` 仅负责整体装配。
6. 修复类型与导出，保证现有行为一致。

## 验证

* 异常场景：权限不足、删除失败、total 拉取失败提示与复位。

## 后续扩展

* 过滤条件更多（区间 total、按 isSync、按视图可见数）→ 组件化新增一行即可。

* 可访问性增强：为控件补充 aria-\* 与键盘导航支持。

* 发布前检查：统一间距与主题 token、空态/错误态、危险操作确认。

