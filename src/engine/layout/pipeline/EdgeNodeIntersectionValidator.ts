import type { IGraph } from "../../graph/IGraph";
import { GeometryIntersection } from "../geometry/GeometryIntersection";
import type { GraphSnapshot } from "../GraphSnapshot";
import type { ILayoutValidator } from "./ILayoutValidator";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";

export class EdgeNodeIntersectionValidator
	implements ILayoutValidator {

	validate(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutValidationIssue[] {
		const issues: LayoutValidationIssue[] = [];

		for (const relation of graph.relations.values()) {
			const path =
				snapshot.paths.get(relation.id);

			if (!path || path.points.length < 2) {
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
					!GeometryIntersection
						.pathIntersectsRectangle(
							path.points,
							position
						)
				) {
					continue;
				}

				issues.push({
					code: "edge-node-intersection",
					severity: "error",
					message:
						`Relation "${relation.id}" crosses unrelated entity "${entityId}".`,
					entityIds: [
						relation.from,
						entityId,
						relation.to
					]
				});
			}
		}

		return issues;
	}
}