# FlowChain Markdown Format

Each Markdown file represents one graph node.

## Node Format

```md
# 节点名称

类型：疾病节点

## 下游关系

- [[节点]]

## 双向关系

- [[节点]]

描述：
可多行记录其它信息。
```

## Rules

- The first heading is the node title.
- `类型：` defines the node type.
- `## 下游关系` defines directed downstream relations.
- `## 双向关系` defines bidirectional relations.
- `描述：` is only descriptive text and must not be used to declare relations.
- A bidirectional relation may be declared in both files. FlowChain still creates only one bidirectional edge.

## Bidirectional Example

```md
# A

类型：疾病节点

## 双向关系

- [[B]]
```

```md
# B

类型：疾病节点

## 双向关系

- [[A]]
```

FlowChain creates one shared bidirectional relation between A and B.
