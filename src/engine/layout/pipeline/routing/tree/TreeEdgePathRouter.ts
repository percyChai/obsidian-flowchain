import type { IGraph } from "../../../../graph/IGraph";
import type { EntityPosition } from "../../../EntityPosition";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import type {
	EdgePort,
	EdgeRoute
} from "../EdgeRoute";
import { ObstacleAvoidingEdgePathRouter } from "../path/ObstacleAvoidingEdgePathRouter";
import type { EdgePath } from "../path/EdgePath";
import type { EdgePathPoint } from "../path/EdgePathPoint";
import type { IEdgePathRouter } from "../path/IEdgePathRouter";
import { TreePrimaryRelationSelector } from "./TreePrimaryRelationSelector";

export class TreeEdgePathRouter
	implements IEdgePathRouter {

	private readonly fallbackRouter =
		new ObstacleAvoidingEdgePathRouter();

	private readonly primaryRelationSelector =
		new TreePrimaryRelationSelector();

	route(
		graph: IGraph,
		snapshot: GraphSnapshot,
		routes:
			ReadonlyMap<string, EdgeRoute>
	): Map<string, EdgePath> {
		/*
		 * Generate normal obstacle-avoiding paths first.
		 * Additional and non-tree relationships retain
		 * these paths.
		 */
		const paths =
			this.fallbackRouter.route(
				graph,
				snapshot,
				routes
			);

		const primaryRelationIds =
			this.primaryRelationSelector.select(
				graph
			);

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

			const route =
				routes.get(relation.id);

			if (
				!fromPosition ||
				!toPosition ||
				!route
			) {
				continue;
			}

			const start =
				this.getPortPoint(
					fromPosition,
					route.fromPort
				);

			const end =
				this.getPortPoint(
					toPosition,
					route.toPort
				);

			const points =
				this.createTreePath(
					start,
					end
				);

			paths.set(
				relation.id,
				{
					relationId:
						relation.id,
					points
				}
			);
		}

		return paths;
	}

	private createTreePath(
		start: EdgePathPoint,
		end: EdgePathPoint
	): EdgePathPoint[] {
		/*
		 * When parent and child are vertically aligned,
		 * use one straight line.
		 */
		if (start.x === end.x) {
			return [
				start,
				end
			];
		}

		/*
		 * TreeLayout places all children of one parent on
		 * the same depth. Therefore, every sibling relation
		 * receives the same branchY and visually shares the
		 * same horizontal branch line.
		 */
		const branchY =
			(start.y + end.y) / 2;

		return [
			start,
			{
				x: start.x,
				y: branchY
			},
			{
				x: end.x,
				y: branchY
			},
			end
		];
	}

	private getPortPoint(
		position: EntityPosition,
		port: EdgePort
	): EdgePathPoint {
		switch (port) {
			case "top":
				return {
					x:
						position.x +
						position.width / 2,
					y:
						position.y
				};

			case "right":
				return {
					x:
						position.x +
						position.width,
					y:
						position.y +
						position.height / 2
				};

			case "bottom":
				return {
					x:
						position.x +
						position.width / 2,
					y:
						position.y +
						position.height
				};

			case "left":
				return {
					x:
						position.x,
					y:
						position.y +
						position.height / 2
				};
		}
	}
}