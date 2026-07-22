# FlowChain

[English](../../README.md) | 简体中文

FlowChain 是一个 Obsidian 插件，用于从 Markdown 笔记生成、同步、布局和美化知识关系图。

## 功能

- 从 Markdown 文件生成 Obsidian Canvas 关系图。
- 按原始 Markdown 范围刷新同步关系图。
- 在多种布局模式之间切换。
- 使用智能推荐布局。
- 美化 Canvas 节点和连线。
- 支持单向关系和双向关系。
- 支持中文和英文 Markdown 关系语法。

## 演示

### Markdown 格式

![Markdown 格式演示](../assets/md格式类型.gif)

### 生成关系图

![生成关系图演示](../assets/生成关系图.gif)

### 切换布局模式

![切换布局模式演示](../assets/切换布局模式.gif)

## Markdown 格式

每个 Markdown 文件代表一个关系图节点。

```md
# 节点名称

类型：疾病

## 下游关系

- [[下游节点]]

## 双向关系

- [[双向节点]]

描述：
可多行记录其它信息。
```

也支持英文写法：

```md
# Node name

Type: Disease

## Downstream Relations

- [[Another node]]

## Bidirectional Relations

- [[Bidirectional node]]

Description:
Additional notes can span multiple lines.
```

规则：

- `类型：` 或 `Type:` 用于定义节点类型。
- `## 下游关系` 或 `## Downstream Relations` 用于定义单向下游关系。
- `## 双向关系` 或 `## Bidirectional Relations` 用于定义双向关系。
- 双向关系可以在两个文件中同时声明，FlowChain 只会生成一条共享的双向连线。
- `描述：` 或 `Description:` 只用于记录说明文字，不用于定义关系。

完整规范见 [Markdown 格式规范](Markdown%20Format.md)。

## 命令

- FlowChain: 生成关系图
- FlowChain: 刷新同步关系图
- FlowChain: 选择布局模式
- FlowChain: 美化关系图

## 布局

- 层级布局
- 层级布局-连线不穿过节点
- 树状布局
- 放射布局
- 力导向布局
- 环形布局
- 智能推荐布局

## 开发

```bash
npm install
npm run build
npm run lint
```

生产构建会在插件根目录输出 `main.js`。

## 手动安装

从 GitHub Releases 下载最新发布包。

当前版本请使用：

```text
flowchain-0.1.1.zip
```

不要使用 GitHub 自动生成的 `Source code (zip)` 手动安装。源码压缩包面向开发者，可能不包含 Obsidian 加载插件所需的 `main.js`。

将发布包解压到：

```text
<Vault>/.obsidian/plugins/flowchain/
```

解压后插件目录应包含：

```text
<Vault>/.obsidian/plugins/flowchain/main.js
<Vault>/.obsidian/plugins/flowchain/manifest.json
<Vault>/.obsidian/plugins/flowchain/styles.css
```

然后重载 Obsidian，并在 **设置 → 第三方插件** 中启用 FlowChain。
