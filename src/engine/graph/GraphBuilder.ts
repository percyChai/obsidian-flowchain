import type { IEntity } from "../entity/IEntity";
import type { IParser } from "../parser/IParser";
import type { MarkdownDocument } from "../parser/MarkdownDocument";
import type { IRelation } from "../relation/IRelation";
import { Graph } from "./Graph";
import type { IGraph } from "./IGraph";
import type { IGraphBuilder } from "./IGraphBuilder";

export class GraphBuilder implements IGraphBuilder {
	constructor(private readonly parser: IParser) {}

	build(documents: MarkdownDocument[]): IGraph {
		const graph = new Graph();
		const entities =
			new Map<string, IEntity>();
		const relations =
			new Map<string, IRelation>();

		for (const document of documents) {
			const parsedData =
				this.parser.parse(document);

			for (const entity of parsedData.entities) {
				entities.set(entity.id, entity);
			}

			for (const relation of parsedData.relations) {
				relations.set(relation.id, relation);
			}
		}

		for (const entity of entities.values()) {
			graph.addEntity(entity);
		}

		for (const relation of relations.values()) {
			if (
				!entities.has(relation.from) ||
				!entities.has(relation.to)
			) {
				continue;
			}

			graph.addRelation(relation);
		}

		return graph;
	}
}
