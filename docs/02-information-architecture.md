# 信息架构

## 公开区

- `/`：产品首页、功能入口和公开活动入口
- `/activity/:token`：活动介绍、创建者自定义说明、开始答题
- `/activity/:token/start`：输入答题者显示名
- `/activity/:token/answer`：答题页、进度、标记、提交确认
- `/activity/:token/result/:attemptId`：答题者自己的结果
- `/help`：使用帮助和规则说明

公开活动只展示发布状态和公开题面。已结束或暂停的活动显示状态提示，不暴露答案。

## 工作台

- `/login`、`/register`
- `/dashboard`：最近活动、待整理题库、学习概览
- `/banks`、`/banks/:id/edit`：题库列表与编辑
- `/banks/:id/questions/:questionId`：题目编辑
- `/activities`、`/activities/new`、`/activities/:id`
- `/activities/:id/results`：汇总与题目分析
- `/activities/:id/results/:respondentId`：答题者详情
- `/mistakes`：错题本
- `/favorites`：收藏
- `/records`：答题记录
- `/settings`：账号、语言、时区

## 状态

题库：`draft`、`published`、`archived`。活动：`draft`、`published`、`paused`、`ended`。答卷：`in_progress`、`submitted`、`expired`。

## 导航原则

桌面端使用侧边导航和顶部账户区；移动端使用底部主导航，编辑和答题页面保持单列。结果页优先呈现关键数字，再提供答题者和题目两个切换视图。
