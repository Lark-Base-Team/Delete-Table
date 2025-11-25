# 项目说明
- 基于 `React + TypeScript + Vite` 开发的 Bitable 扩展
- 使用组件库 `antd`，集成 `@lark-base-open/js-sdk`
- 所有自定义 Hooks 已使用 JSDoc 注释，便于快速理解与维护

# 开发与调试
- 安装依赖：`npm install`
- 本地运行：`npm run dev`
- 构建产物：`npm run build`
- 本地预览：`npm run preview`

# 目录结构（节选）
- `src/hooks/live/`：与 Bitable 同步的实时数据 Hooks
- `src/components/LoadApp/hooks/`：业务级 Hooks（表列表、总数、主题等）

# Hooks 一览
- `useTablesLive()`：订阅并读取当前 Base 的表元数据列表
- `useSelectionLive()`：订阅并读取当前选区的实时状态
- `useFieldsLive(tableId)`：读取指定表的字段元数据列表
- `useViewsLive(tableId)`：读取视图元数据与当前激活视图 ID
- `useCellsLive(tableId, recordId, fieldId)`：订阅并读取指定单元格值
- `useRecordsLive(tableId)`：维护记录总数并随增删同步
- `useTotals(filteredIds, pagedIds, filterActive)`：按需懒加载与补齐各表记录总数
- `useTables()`：管理数据表列表加载与批量删除
- `useThemeClass()`：读取并订阅 Bitable 主题，返回容器类名

# 约定
- 组件库统一使用 `antd`
- 代码注释统一使用 `JSDoc` 风格
- 推荐使用别名 `alias` 导入组件与模块，避免深层相对路径

# 文档与指南
- Base Extension Development Guide: https://lark-technologies.larksuite.com/docx/HvCbdSzXNowzMmxWgXsuB2Ngs7d
- 多维表格扩展脚本开发指南: https://feishu.feishu.cn/docx/U3wodO5eqome3uxFAC3cl0qanIe

# 发布
- 先执行 `npm run build`，提交 `dist` 目录与打包结果
- 然后填写表单：
  - 英文表单: https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e
  - 中文表单: https://feishu.feishu.cn/share/base/form/shrcnGFgOOsFGew3SDZHPhzkM0e
