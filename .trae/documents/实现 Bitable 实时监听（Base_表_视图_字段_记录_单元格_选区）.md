## 目标与范围
- 为 Base、Table、View、Field、Record、Cell 的数据变化，以及选中状态（Selection）变化建立统一的实时监听机制。
- 当上述维度发生改变时，插件内 UI 与数据状态即时同步，用户无需手动刷新。

## 当前代码现状（需改造处）
- 项目主要使用一次性拉取：`bitable.base.getTableMetaList()`、`bitable.base.getSelection()` 等；未订阅数据变化。
- 已存在实时监听仅用于主题：`bridge.onThemeChange`（`src/components/LoadApp/hooks/useThemeClass.ts`）。
- 典型改造点：
  - `src/components/LoadApp/hooks/useTables.ts` 使用拉取刷新列表；需要替换为“实时源”。
  - `src/components/TableSelector/index.tsx` 初始化用 `getTableMetaList/getSelection`；删除后再手动拉取；需要改为订阅驱动。
  - `src/components/LoadApp/hooks/useTotals.ts` 通过拉取记录页数估算总数；需要在记录变化时自动更新。

## 技术方案总览
- 统一事件层：新增一个 `bitableEventHub`（轻封装 SDK 订阅接口）。
  - 封装“可选事件订阅”：优先使用 SDK 的事件（如 selection/table/view/field/record/cell 的变化事件），如果当前运行环境未提供，自动降级为轻量轮询（500–1000ms，可配置、节流）。
  - 提供统一 API：`subscribe(topic, scopeId?, handler) -> unsubscribe`；内部负责去重、合并和错误处理。
- React 接入：以 `useSyncExternalStore` 为核心实现稳定的订阅型 Hook。
  - `useSelectionLive()`：实时拿到当前选区（表、视图、记录、字段、单元格位置等）。
  - `useTablesLive()`：实时表列表（新增/删除/重命名变更）。
  - `useViewsLive(tableId)`：实时视图列表与激活视图变化。
  - `useFieldsLive(tableId)`：实时字段列表（新增/删除/重命名/类型变化）。
  - `useRecordsLive(tableId, viewId, filter?)`：记录增删改事件；本地做增量更新，必要时按页拉取校准。
  - `useCellsLive(tableId, recordId, fieldId)`：单元格值变化订阅；无事件时按需精确轮询该单元格。
- 性能与一致性
  - 事件批处理：将高频事件在 16–33ms 窗口内批量合并，避免多次渲染。
  - 轻量轮询按需触发：仅在“订阅缺失”或“首次加载后”对热点数据进行轮询；带指数退避与停止条件。
  - 内部维护快照与版本号，遇到乱序事件也能正确归并。
- 错误与权限
  - 监听/探测权限变化（若 SDK 提供），在权限变更时自动重建订阅与数据快照。
  - 事件与轮询都统一走错误处理与重试通道；用户界面展示轻量提示（toast/状态角标）。
- 解绑与资源回收
  - 所有 Hook 在组件卸载时自动 `unsubscribe`；`bitableEventHub` 维护计数与最后一个订阅解除后关闭轮询。

## 具体改动与接入点
- 新增：`src/lib/bitableEventHub.ts`（事件统一层，仅封装、无业务）。
- 新增：`src/hooks/live/` 目录下的订阅型 Hook（`useSelectionLive/useTablesLive/useViewsLive/useFieldsLive/useRecordsLive/useCellsLive`）。
- 改造：
  - `src/components/LoadApp/hooks/useTables.ts` 将 `refreshTables()` 与派生 `tableOptions` 改为使用 `useTablesLive()` 的快照（保留 `useMemo` 以维持渲染优化）。
  - `src/components/TableSelector/index.tsx` 初始化与后续列表变化改为使用 `useTablesLive()`，删除表后无需手动拉取。
  - `src/components/LoadApp/hooks/useTotals.ts` 使用 `useRecordsLive()` 的记录总览或增量事件，实时更新统计。
  - 其他使用 `bitable.base.getSelection()` 的位置，替换为 `useSelectionLive()`，以实现选区变化的即时响应。

## 事件来源与降级策略
- 首选：使用 SDK 提供的事件订阅 API（如 `on...Change` 或 `watch` 类方法）。
- 降级：当某类事件不可用时，采用“最小必要轮询”与“增量比对”（例如只对当前活跃表/视图/字段子集做轮询，检测差异触发更新）。
- 可配置：提供统一的 `pollInterval` 与“热点优先”策略，默认不超过 1000ms，避免对宿主产生压力。

## 验证方案（无需预览）
- 开发态日志：为各 Hook 加可开关的调试日志，记录订阅建立/事件接收/快照变更。
- 手动操作验证：
  - 在宿主中新增/删除表、重命名字段、新增/编辑记录、修改单元格、切换选区；观察各 UI 组件即时变化。
  - 在插件内新增记录或改字段，验证双向一致性（宿主和插件都能触发更新）。
- 一致性校准：在高频改动后做一次静默拉取与快照比对（仅在调试模式开启时），确保增量合并正确。

## 交付物
- 统一订阅封装：`bitableEventHub`。
- 6 个订阅型 Hook 与类型定义。
- 改造过的 3 处现有文件（tables、selector、totals）及必要的轻量错误提示。

## 风险与缓解
- SDK 事件覆盖不全：通过降级轮询与增量合并确保功能可用。
- 性能风险：批处理、节流与“热点优先”策略控制事件风暴。
- 复杂度提升：封装统一层，外部以 Hook 统一使用，降低接入复杂度。

## 下一步
- 我将按照上述方案落地实现：先引入 `bitableEventHub` 与 `useTablesLive/useSelectionLive` 两个最关键链路，再逐步覆盖 View/Field/Record/Cell 的事件流，最后完成三处组件改造与验证。