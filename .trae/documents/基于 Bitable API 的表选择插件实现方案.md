## 目标
- 在插件中拉取当前 Base 的所有数据表并展示下拉选择，支持默认选中当前表，选择后提供回调或跳转到该表。

## 技术方案
- 使用 `bitable.base.getTableMetaList()` 拉取表列表，`bitable.base.getSelection()` 获取默认选中表。
- 采用已有 UI 框架（与组件目录保持一致用 `antd`），封装成可复用 `TableSelector` 组件。
- 选择事件可选触发：`bitable.ui.switchToTable(tableId)` 或向上抛出 `onChange`。
- 国际化沿用现有 `locales/i18n.ts`，文案：`选择数据表`、`请选择数据表`。

## 具体实现
### 新增组件：`src/components/TableSelector/index.tsx`
- 状态：`tableMetaList: ITableMeta[]`、`loading: boolean`、`value: string | undefined`。
- 初始化：
  - `useEffect` 并发调用 `getTableMetaList()` 与 `getSelection()`；设置下拉选项与默认值。
  - 失败时通过 `bitable.ui.showToast({ toastType: 'error', message })` 提示。
- 渲染：
  - 使用 `antd` 的 `Select`，`options = metaList.map(({id,name}) => ({ value:id, label:name }))`。
  - `placeholder`：`请选择数据表`；`loading`/`disabled` 根据状态控制。
- 行为：
  - `onChange(tableId)`：
    - 若传入 `props.onChange`，先调用回调；
    - 若传入 `props.switchOnSelect === true`，执行 `bitable.ui.switchToTable(tableId)` 并根据结果 toast 成功/失败。

### 集成
- 在 `src/App.tsx` 或需要处引入：
  - 用 `<TableSelector onChange={(id)=>{/* 业务回调 */}} switchOnSelect />` 渲染；
  - 可替换现有 `Form.Select field='table'`，保持功能一致（默认选中 `selection.tableId`）。

### 错误处理与边界
- 空列表：展示空状态，禁用下拉；
- 权限不足：`getPermission` 可用于决定是否允许跳转；
- 大数据量：列表选项直接渲染；如超大可后续加搜索。

## 验证
- 启动开发环境，确保：
  - 下拉能显示所有表；
  - 默认选中当前表；
  - 切换表时正确跳转或回调触发；
  - 异常时出现 toast 提示。

## 可选增强
- 支持搜索与高亮当前选中表；
- 暗色主题适配（通过 `bitable.bridge.getTheme()`）。

请确认是否按此方案在代码库中新增并集成 `TableSelector` 组件。