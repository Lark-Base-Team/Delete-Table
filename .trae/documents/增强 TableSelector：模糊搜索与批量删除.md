## 目标
- 在现有表选择组件中支持模糊搜索（大小写不敏感），提升查找表效率。
- 支持批量选择多个表并一键删除，包含删除前确认与权限/边界校验。

## 技术方案
- 使用 `antd` 的 `Select` 开启 `showSearch` 并自定义 `filterOption`，实现更友好的模糊匹配（对 `label` 执行 `includes` + 大小写忽略）。
- 扩展组件为双模式：
  - 选择模式：保持现有单选逻辑不变。
  - 批量删除模式：`mode="multiple"` 允许多选，渲染“删除所选”按钮 + 二次确认弹窗。
- 删除流程：
  - 逐项校验权限：`bitable.base.getPermission({ entity: 'Table', type: 'deletable', param: { tableId } })`；不可删则收集并提示。
  - 执行 `bitable.base.deleteTable(tableId)`；用 `Promise.allSettled` 并发删除，收集成功/失败。
  - 特殊错误处理：捕获 `LastTableDeleteForbiddenError` 显示明确提示；其他错误统一 message。
  - 删除完成后刷新列表：`bitable.base.getTableMetaList()`；如果当前选中表被删除，清空当前值。

## 具体实现
### 组件 API 设计
- `TableSelector` 新增属性：
  - `deletable?: boolean`：启用批量删除模式；渲染“删除所选”。
  - `onDeleted?: (result: { successIds: string[]; failIds: string[] }) => void`：删除结果回调。
  - 保持 `onChange`、`switchOnSelect` 等现有属性。
- 搜索：
  - `filterOption={(input, option) => option?.label?.toLowerCase().includes(input.toLowerCase())}`。
- 删除 UI：
  - 使用 `antd` 的 `Modal.confirm` 展示表名清单与提示；确认后执行删除。
  - 删除按钮在 `deletable` 模式下才显示，按钮禁用条件：未选择或正在删除。

### 行为与状态
- 状态新增：`selectedIds: string[]`、`deleting: boolean`。
- 交互：
  - 多选选择变化更新 `selectedIds`。
  - 点击删除：校验权限 → 并发删除 → 汇总结果 toast → 回调 → 刷新列表与选中态。
- 提示文案：按 `bitable.bridge.getLanguage()` 切换中/英文。

### 集成
- 在 `App.tsx` 添加一个“批量删除”区块示例：
  - `<TableSelector deletable />` 渲染批量删除入口；和现有单选下拉互不影响。

## 验证
- 本地预览：验证模糊搜索匹配、单选与多选切换、权限拒绝提示、最后一张表禁止删除提示、批量删除成功/失败汇总与列表刷新。

## 可选增强
- 拼音模糊搜索：后续可加入轻量拼音库或自定义拼音索引，以提升中文搜索体验。
- 撤销与误删保护：增加“最近删除”提示与恢复入口（依赖后端能力）。

请确认按此方案修改并集成，随后我将直接实现代码与验证。