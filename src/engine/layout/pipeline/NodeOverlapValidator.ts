import type { IGraph } from "../../graph/IGraph";
import type { EntityPosition } from "../EntityPosition";
import type { GraphSnapshot } from "../GraphSnapshot";
import type { ILayoutValidator } from "./ILayoutValidator";
import type { LayoutValidationIssue } from "./LayoutValidationIssue";

export class NodeOverlapValidator
	implements ILayoutValidator {

	validate(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutValidationIssue[] {
		const issues: LayoutValidationIssue[] = [];

		const entries = Array.from(
			snapshot.positions.entries()
		);

		for (let firstIndex = 0;
			firstIndex < entries.length;
			firstIndex++) {

			const firstEntry = entries[firstIndex];

			if (!firstEntry) {
				continue;
			}

			for (
				let secondIndex = firstIndex + 1;
				secondIndex < entries.length;
				secondIndex++
			) {
				const secondEntry =
					entries[secondIndex];

				if (!secondEntry) {
					continue;
				}

				const [
					firstEntityId,
					firstPosition
				] = firstEntry;

				const [
					secondEntityId,
					secondPosition
				] = secondEntry;

				if (
					!graph.entities.has(firstEntityId) ||
					!graph.entities.has(secondEntityId)
				) {
					continue;
				}

				if (
					!this.isOverlapping(
						firstPosition,
						secondPosition
					)
				) {
					continue;
				}

				issues.push({
					code: "node-overlap",
					severity: "error",
					message:
						`Entities overlap: ${firstEntityId}, ${secondEntityId}`,
					entityIds: [
						firstEntityId,
						secondEntityId
					]
				});
			}
		}

		return issues;
	}

	private isOverlapping(
		first: EntityPosition,
		second: EntityPosition
	): boolean {
		return !(
			first.x + first.width <= second.x ||
			second.x + second.width <= first.x ||
			first.y + first.height <= second.y ||
			second.y + second.height <= first.y
		);
	}
}