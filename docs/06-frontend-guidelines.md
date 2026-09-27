# 前端开发约定

## 技术与目录

`apps/web` 使用 uni-app + Vue 3 + TypeScript，`apps/seo-web` 使用 Nuxt 3。共享类型来自 `packages/shared`，共享文案来自 `packages/i18n`。

```text
src/
  pages/          页面
  components/     领域无关组件
  stores/         auth、banks、activities、study
  services/       API client 与 DTO 映射
  composables/    权限、分页、答题计时
  styles/         token、主题、响应式规则
```

## 状态管理

Pinia 按领域拆分 store；服务端数据和本地 UI 状态分离。答题草稿以 `activity token + respondent key` 为键本地保存，提交成功后清理。敏感 session 不写入 localStorage。

## 交互规则

答题页固定题号进度、未答提示、提交二次确认和网络失败重试。题库编辑页支持草稿、校验、排序和离开保护。所有列表采用游标分页、加载态、空态和错误态。

## 类型与校验

表单先在客户端做友好校验，服务端 schema 是最终边界。API client 统一处理超时、401、错误码和语言 header。禁止在组件内散落 URL、错误文案或业务评分逻辑。

## 响应式与无障碍

桌面端支持键盘操作和宽屏双栏；移动端单栏、触控目标至少 44px。颜色不能作为唯一状态提示，题目、按钮和表单必须有可读标签。组件使用稳定尺寸，避免加载或错误文本导致布局跳动。
