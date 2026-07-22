# FlowChain Architecture

FlowChain is an Obsidian plugin that builds knowledge relationship graphs from Markdown and visualizes them on Obsidian Canvas.

## Principles

- Markdown is the source of truth.
- Graph data is independent from Canvas.
- Layout engines are independent from Canvas output.
- Canvas is only the visualization layer.

## Current Data Flow

```text
Markdown files
-> MarkdownParser
-> GraphBuilder
-> Graph
-> LayoutManager
-> LayoutPipeline
-> CanvasSync
-> CanvasAdapter
-> Obsidian Canvas
```

## Core Commands

- FlowChain: 生成关系图
- FlowChain: 刷新同步关系图
- FlowChain: 选择布局模式
- FlowChain: 美化关系图

## Current Canvas Output Path

```text
CanvasSync
-> CanvasAdapter
-> Obsidian Canvas
```

There is no separate Renderer abstraction in the current implementation.

## Layouts

- 层级布局
- 层级布局-连线不穿过节点
- 树状布局
- 放射布局
- 力导向布局
- 环形布局
- 智能推荐布局

## Sessions

FlowChain sessions are isolated by Canvas file path. Commands operate on the Canvas captured at command start.
