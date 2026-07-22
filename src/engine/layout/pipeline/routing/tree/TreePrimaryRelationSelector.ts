import type { IGraph } from "../../../../graph/IGraph";
import { GraphQuery } from "../../../../query/GraphQuery";

export class TreePrimaryRelationSelector {
	select(
		graph: IGraph
	): ReadonlySet<string> {
		const query =
			new GraphQuery(graph);

		const primaryRelationIds =
			new Set<string>();

		for (
			const entity
			of graph.entities.values()
		) {
			const incomingRelations =
				query.findIncomingRelations(
					entity.id
				);

			const primaryRelation =
				incomingRelations.find(
					relation =>
						relation.from !==
							entity.id &&
						graph.getEntity(
							relation.from
						) !== undefined
				);

			if (!primaryRelation) {
				continue;
			}

			primaryRelationIds.add(
				primaryRelation.id
			);
		}

		return primaryRelationIds;
	}
}