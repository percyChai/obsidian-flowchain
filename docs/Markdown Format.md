# FlowChain Markdown Format

FlowChain treats each Markdown file as one graph node. Relations are declared with wiki links in dedicated sections.

## English Syntax

```md
# Node name

Type: Disease

## Downstream Relations

- [[Target node]]

## Bidirectional Relations

- [[Mutual node]]

Description:
Additional notes can span multiple lines.
```

## Chinese Syntax

```md
# 节点名称

类型：疾病

## 下游关系

- [[目标节点]]

## 双向关系

- [[双向节点]]

描述：
可多行记录其它信息。
```

## Supported Field Names

| Purpose | English | Chinese |
| --- | --- | --- |
| Node type | `Type:`, `Entity Type:`, `Node Type:` | `类型：` |
| Directed relations | `## Downstream Relations`, `## Downstream`, `## Outgoing Relations` | `## 下游关系` |
| Bidirectional relations | `## Bidirectional Relations`, `## Bidirectional`, `## Mutual Relations`, `## Two-way Relations` | `## 双向关系` |
| Description | `Description:`, `Desc:`, `Notes:` | `描述：` |

## Supported Node Types

FlowChain accepts both Chinese and English node type names.

| English | Chinese |
| --- | --- |
| `Factor`, `Influencing Factor`, `Risk Factor` | `影响因素` |
| `Mechanism` | `机制` |
| `Disease`, `Disease Node` | `疾病` |
| `Symptom` | `症状` |
| `Drug`, `Medicine`, `Medication` | `药物` |
| `Test`, `Exam`, `Examination`, `Inspection` | `检查` |
| `Treatment`, `Therapy` | `治疗` |
| `Lifestyle` | `生活方式` |
| `Nutrition` | `营养` |
| `Other` | `其它`, `其他` |

Unknown node types are allowed and fall back to the `Other` style.

## Rules

- The first level-one heading is used as the node title.
- The file name should match the node title for stable refresh and rename behavior.
- Downstream relations create directed edges.
- Bidirectional relations create one shared bidirectional edge, even if both files declare the same relation.
- `Description:` / `描述：` is only descriptive text and must not be used to declare relations.
- Do not declare upstream relations. FlowChain derives upstream structure from downstream and bidirectional relations.

## Bidirectional Example

```md
# A

Type: Disease

## Bidirectional Relations

- [[B]]
```

```md
# B

Type: Disease

## Bidirectional Relations

- [[A]]
```

FlowChain creates one shared bidirectional relation between A and B.
