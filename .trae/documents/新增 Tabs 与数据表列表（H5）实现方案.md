## 目标
- 在现有组件中加入 Tabs，区分两页：
  - 批量删除数据表（保留现有功能）
  - 数据表列表展示（新增）
- 列表页包含：分页表格（≤3列基本信息）、顶部模糊筛选与“一键删除筛选结果”按钮。
- 遵循 H5 规范（移动端友好、触控友好、性能与易读性）。

## UI 与交互
- Tabs：使用 `antd` 的 `Tabs`，默认打开“数据表列表展示”。
- 列表页布局：
  - 顶部工具栏（固定）：`Input` 搜索框（支持清空、大小写不敏感模糊），`Button` 一键删除筛选结果。
  - 主体：`Table` 分页（每页 10 条，可配置），三列：`name`、`id`、`isSync`（布尔显示为“已同步/未同步”）。
  - 空态与加载态：`Table` 自带空态；加载时 `Spin` 或 `Table` 的 `loading`。
  - 删除流程：点“一键删除筛选结果”→ 二次确认弹窗 → 权限校验 → 并发删除 → Toast 汇总 → 刷新。
- 批量删除页：保留当前“多选下拉 + 删除”实现不变，迁移为 Tab 内内容。
- 响应式：
  - 顶部工具条采用自适应行内布局，按钮与输入框最小触控区域 ≥ 44px 高；表格列名简短；在窄屏下适度减小字号并增加行间距。

## 数据与状态
- 统一拉取：`bitable.base.getTableMetaList()` 与 `bitable.bridge.getLanguage()` 在组件挂载时并发获取；语言驱动文案。
- 状态：`tableMetaList`、`filteredList`、`searchText`、`pagination`（`current`、`pageSize`、`total`）、`loading`、`deleting`。
- 过滤：对 `name` 和 `id` 执行大小写不敏感的 `includes`；更新 `filteredList` 与 `pagination.total`。
- 删除：
  - 权限：`bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId } })`
  - 并发：`Promise.allSettled` 对可删列表执行 `bitable.base.deleteTable(id)`；统计成功/失败。
  - 刷新：删除后重新调用 `getTableMetaList` 更新列表并重置分页到第一页；Toast 使用 `ToastType` 枚举。

## 类型与国际化
- 严格类型：使用 `ITableMeta`、`ToastType`；避免字符串类型不匹配。
- 文案：根据 `language` 切换中英文；使用简短按钮/列名；空态与错误提示均本地化。

## 代码改动点
- `src/components/LoadApp/index.tsx`
  - 引入 `Tabs`、`Input`、`Table`；封装两个 Tab 内容：`DeleteTab`（复用现有删除 UI）、`ListTab`（新增）。
  - 抽取工具函数：`fetchMeta()`、`filterMeta(search)`、`deleteTables(ids)`。
  - 保持现有删除逻辑与提示规范，统一 ToastType 使用。
- 其他文件无需改动；继续以 `index.tsx` 渲染 `LoadApp`。

## 验证
- 本地预览：
  - 搜索实时过滤；分页数值与总数正确；一键删除按筛选集执行；异常/无权限场景提示；成功后列表刷新。
  - 移动端窗口（窄视口）下检查触控尺寸、滚动与固定工具栏布局是否正常。

## 可选增强
- 批量选择行删除（表格勾选）作为补充入口。
- `isSync` 显示为徽标或图标以提高易读性。

请确认按此方案更新 `LoadApp`，我将开始实现与验证。