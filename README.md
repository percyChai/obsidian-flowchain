# FlowChain

FlowChain is an Obsidian plugin for generating, synchronizing, laying out, and styling knowledge relationship graphs from Markdown notes.

## Features

- Generate knowledge graphs from Markdown files.
- Refresh Canvas graphs from the original Markdown scope.
- Switch between multiple layout modes.
- Use smart layout recommendations.
- Beautify Canvas nodes and edges.
- Support directed and bidirectional relations.

## Markdown Format

Each Markdown file represents one graph node.

```md
# Node name

类型：疾病节点

## 下游关系

- [[Another node]]

## 双向关系

- [[Bidirectional node]]

描述：
Additional notes can span multiple lines.
```

Rules:

- `## 下游关系` creates directed downstream edges.
- `## 双向关系` creates bidirectional edges.
- Bidirectional relations may be declared in both files. FlowChain creates one shared bidirectional edge.
- `描述：` is only descriptive text and is not used to define relations.

## Commands

- FlowChain: 生成关系图
- FlowChain: 刷新同步关系图
- FlowChain: 选择布局模式
- FlowChain: 美化关系图

## Layouts

- 层级布局
- 层级布局-连线不穿过节点
- 树状布局
- 放射布局
- 力导向布局
- 环形布局
- 智能推荐布局

## Development

```bash
npm install
npm run build
npm run lint
```

The production build outputs `main.js` at the plugin root.

## Manual Installation

Copy these files into your vault plugin folder:

```text
<Vault>/.obsidian/plugins/flowchain/
```

Required files:

- `main.js`
- `manifest.json`
- `styles.css`

Then reload Obsidian and enable FlowChain in **Settings -> Community plugins**.
