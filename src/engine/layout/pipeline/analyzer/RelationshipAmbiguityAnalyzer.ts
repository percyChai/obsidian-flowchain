import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { EntityPosition } from "../../EntityPosition";
import type { ILayoutAnalyzer } from "./ILayoutAnalyzer";
import {
	LayoutProblemType,
	type LayoutProblem
} from "./LayoutProblem";

export class RelationshipAmbiguityAnalyzer
	implements ILayoutAnalyzer {

	analyze(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutProblem[] {

		const problems: LayoutProblem[] = [];

		for (const relation of graph.relations.values()) {

			const from =
				snapshot.positions.get(
					relation.from
				);

			const to =
				snapshot.positions.get(
					relation.to
				);

			if (!from || !to) {
				continue;
			}

			for (
				const [entityId, position]
				of snapshot.positions
			) {

				if (
					entityId === relation.from ||
					entityId === relation.to
				) {
					continue;
				}

				if (
					!this.isBetween(
						from,
						to,
						position
					)
				) {
					continue;
				}

				problems.push({
					type:
						LayoutProblemType.RelationshipAmbiguity,
					entityIds: [
						relation.from,
						entityId,
						relation.to
					],
					message:
						`Entity "${entityId}" is visually located between "${relation.from}" and "${relation.to}".`
				});
			}
		}

		return problems;
	}

	private isBetween(
		from: EntityPosition,
		to: EntityPosition,
		target: EntityPosition
	): boolean {

		const fromCenter =
			from.y + from.height / 2;

		const toCenter =
			to.y + to.height / 2;

		const targetCenter =
			target.y + target.height / 2;

		const minY =
			Math.min(fromCenter, toCenter);

		const maxY =
			Math.max(fromCenter, toCenter);

		if (
			targetCenter <= minY ||
			targetCenter >= maxY
		) {
			return false;
		}

		const fromX =
			from.x + from.width / 2;

		const toX =
			to.x + to.width / 2;

		const targetX =
			target.x + target.width / 2;

		const centerX =
			(fromX + toX) / 2;

		return (
			Math.abs(
				targetX - centerX
			) < Math.max(
				from.width,
				to.width
			)
		);
	}
}