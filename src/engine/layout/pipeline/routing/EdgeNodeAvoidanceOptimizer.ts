import type { IGraph } from "../../../graph/IGraph";
import { GeometryIntersection } from "../../geometry/GeometryIntersection";
import type { EntityPosition } from "../../EntityPosition";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { IRoutingOptimizer } from "./IRoutingOptimizer";

const HORIZONTAL_CLEARANCE = 120;

export class EdgeNodeAvoidanceOptimizer
	implements IRoutingOptimizer {

	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot
	): GraphSnapshot {
		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);

		const movedEntityIds =
			new Set<string>();

		let moveDirection = 1;

		for (const relation of graph.relations.values()) {
			const path =
				snapshot.paths.get(relation.id);

			if (!path || path.points.length < 2) {
				continue;
			}

			for (
				const [entityId, position]
				of positions
			) {
				if (
					entityId === relation.from ||
					entityId === relation.to ||
					movedEntityIds.has(entityId)
				) {
					continue;
				}

				if (
					!GeometryIntersection
						.pathIntersectsRectangle(
							path.points,
							position
						)
				) {
					continue;
				}

				const newPosition: EntityPosition = {
					...position,
					x:
						position.x +
						(
							position.width +
							HORIZONTAL_CLEARANCE
						) *
						moveDirection
				};

				positions.set(
					entityId,
					newPosition
				);

				movedEntityIds.add(entityId);

				moveDirection *= -1;
			}
		}

		return {
			...snapshot,
			positions
		};
	}
}