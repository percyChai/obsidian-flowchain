import type { IGraph } from "../../../graph/IGraph";
import type { EntityPosition } from "../../EntityPosition";
import type { GraphSnapshot } from "../../GraphSnapshot";
import {
	LayoutProblemType,
	type LayoutProblem
} from "../analyzer/LayoutProblem";
import type { ISemanticOptimizer } from "./ISemanticOptimizer";

const DEFAULT_HORIZONTAL_OFFSET = 360;

export class SemanticOptimizer
	implements ISemanticOptimizer {

	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot,
		problems: readonly LayoutProblem[]
	): GraphSnapshot {
		void graph;

		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);

		const movedEntityIds = new Set<string>();
		let moveDirection = 1;

		for (const problem of problems) {
			if (
				problem.type !==
				LayoutProblemType.RelationshipAmbiguity
			) {
				continue;
			}

			const obstructingEntityId =
				problem.entityIds[1];

			if (
				obstructingEntityId === undefined ||
				movedEntityIds.has(obstructingEntityId)
			) {
				continue;
			}

			const currentPosition =
				positions.get(obstructingEntityId);

			if (!currentPosition) {
				continue;
			}

			positions.set(
				obstructingEntityId,
				{
					...currentPosition,
					x:
						currentPosition.x +
						DEFAULT_HORIZONTAL_OFFSET *
							moveDirection
				}
			);

			movedEntityIds.add(
				obstructingEntityId
			);

			moveDirection *= -1;
		}

		return {
			...snapshot,
			positions
		};
	}
}