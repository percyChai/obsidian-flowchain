import type { IGraph } from "../../../../graph/IGraph";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import {
	EdgeOrientation
} from "./EdgeOrientation";
import type {
	ISemanticEdgeRouter
} from "./ISemanticEdgeRouter";
import type {
	SemanticEdgeRoute
} from "./SemanticEdgeRoute";

export class SemanticEdgeRouter
	implements ISemanticEdgeRouter {

	route(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, SemanticEdgeRoute> {

		void snapshot;

		const routes =
			new Map<string, SemanticEdgeRoute>();

		for (
			const relation
			of graph.relations.values()
		) {
			/*
			 * 第一版统一采用 Vertical。
			 *
			 * 后续：
			 *
			 * Hierarchy -> Vertical
			 * Tree      -> Vertical
			 * Timeline  -> Horizontal
			 * Radial    -> Radial
			 */

			routes.set(
				relation.id,
				{
					relationId:
						relation.id,
					orientation:
						EdgeOrientation.Vertical
				}
			);
		}

		return routes;
	}
}