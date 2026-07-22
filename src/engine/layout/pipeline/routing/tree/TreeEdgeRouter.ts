import type { IGraph } from "../../../../graph/IGraph";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import { DirectionalEdgeRouter } from "../DirectionalEdgeRouter";
import type { EdgeRoute } from "../EdgeRoute";
import type { IEdgeRouter } from "../IEdgeRouter";
import { TreePrimaryRelationSelector } from "./TreePrimaryRelationSelector";

export class TreeEdgeRouter
	implements IEdgeRouter {

	private readonly fallbackRouter =
		new DirectionalEdgeRouter();

	private readonly primaryRelationSelector =
		new TreePrimaryRelationSelector();

	route(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, EdgeRoute> {
		/*
		 * First generate normal routes for every relation.
		 * Non-tree and additional-parent relations keep
		 * these routes.
		 */
		const routes =
			this.fallbackRouter.route(
				graph,
				snapshot
			);

		const primaryRelationIds =
			this.primaryRelationSelector.select(
				graph
			);

		/*
		 * Main tree relations always leave from the bottom
		 * of the parent and enter through the top of the
		 * child.
		 */
		for (
			const relation
			of graph.relations.values()
		) {
			if (
				!primaryRelationIds.has(
					relation.id
				)
			) {
				continue;
			}

			const fromPosition =
				snapshot.positions.get(
					relation.from
				);

			const toPosition =
				snapshot.positions.get(
					relation.to
				);

			if (
				!fromPosition ||
				!toPosition
			) {
				continue;
			}

			routes.set(
				relation.id,
				{
					relationId:
						relation.id,
					fromPort: "bottom",
					toPort: "top"
				}
			);
		}

		return routes;
	}
}