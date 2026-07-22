import type { IGraph } from "../../../graph/IGraph";
import type { EntityPosition } from "../../EntityPosition";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { ILayoutOptimizer } from "../ILayoutOptimizer";

const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 80;
const MAX_PASSES = 20;

export class GeometryOptimizer
	implements ILayoutOptimizer {

	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot
	): GraphSnapshot {
		void graph;

		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);

		for (
			let pass = 0;
			pass < MAX_PASSES;
			pass++
		) {
			const changed =
				this.resolveOverlaps(positions);

			if (!changed) {
				break;
			}
		}

		return {
			...snapshot,
			positions
		};
	}

	private resolveOverlaps(
		positions: Map<string, EntityPosition>
	): boolean {
		const entries =
			Array.from(positions.entries());

		let changed = false;

		for (
			let firstIndex = 0;
			firstIndex < entries.length;
			firstIndex++
		) {
			const firstEntry =
				entries[firstIndex];

			if (!firstEntry) {
				continue;
			}

			const [
				firstEntityId,
				firstPosition
			] = firstEntry;

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
					secondEntityId,
					secondPosition
				] = secondEntry;

				if (
					!this.isTooClose(
						firstPosition,
						secondPosition
					)
				) {
					continue;
				}

				const newPosition = {
					...secondPosition,
					x:
						firstPosition.x +
						firstPosition.width +
						HORIZONTAL_GAP
				};

				positions.set(
					secondEntityId,
					newPosition
				);

				entries[secondIndex] = [
					secondEntityId,
					newPosition
				];

				changed = true;
			}

			positions.set(
				firstEntityId,
				firstPosition
			);
		}

		return changed;
	}

	private isTooClose(
		first: EntityPosition,
		second: EntityPosition
	): boolean {
		return !(
			first.x + first.width + HORIZONTAL_GAP
				<= second.x ||
			second.x + second.width + HORIZONTAL_GAP
				<= first.x ||
			first.y + first.height + VERTICAL_GAP
				<= second.y ||
			second.y + second.height + VERTICAL_GAP
				<= first.y
		);
	}
}