# FlowChain Markdown 格式规范

FlowChain 将每个 Markdown 文件视为一个关系图节点，并通过固定章节中的 WikiLink 声明关系。

## 中文写法

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

## 英文写法

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

## 支持的字段名

| 用途 | 中文 | 英文 |
| --- | --- | --- |
| 节点类型 | `类型：` | `Type:`, `Entity Type:`, `Node Type:` |
| 单向下游关系 | `## 下游关系` | `## Downstream Relations`, `## Downstream`, `## Outgoing Relations` |
| 双向关系 | `## 双向关系` | `## Bidirectional Relations`, `## Bidirectional`, `## Mutual Relations`, `## Two-way Relations` |
| 描述 | `描述：` | `Description:`, `Desc:`, `Notes:` |

## 支持的节点类型

| 中文 | 英文 |
| --- | --- |
| `影响因素` | `Factor`, `Influencing Factor`, `Risk Factor` |
| `机制` | `Mechanism` |
| `疾病` | `Disease`, `Disease Node` |
| `症状` | `Symptom` |
| `药物` | `Drug`, `Medicine`, `Medication` |
| `检查` | `Test`, `Exam`, `Examination`, `Inspection` |
| `治疗` | `Treatment`, `Therapy` |
| `生活方式` | `Lifestyle` |
| `营养` | `Nutrition` |
| `其它`, `其他` | `Other` |

未识别的节点类型允许存在，并会回退到“其它”样式。

## 规则

- 一级标题作为节点标题。
- 建议文件名与一级标题保持一致，便于刷新同步和重命名保持稳定。
- 下游关系生成单向边。
- 双向关系生成一条共享双向边，即使两个文件都声明同一关系，也不会生成重复边。
- `描述：` / `Description:` 只用于记录说明文字，不能用来声明关系。
- 不要声明“上游关系”，FlowChain 会根据下游关系和双向关系自动推导图结构。

## 双向关系示例

```md
# A

类型：疾病

## 双向关系

- [[B]]
```

```md
# B

类型：疾病

## 双向关系

- [[A]]
```

FlowChain 会在 A 和 B 之间生成一条共享双向关系。
