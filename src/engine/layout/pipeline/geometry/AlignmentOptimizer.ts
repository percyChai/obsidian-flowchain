import type { IGraph } from "../../../graph/IGraph";

import type { GraphSnapshot } from "../../GraphSnapshot";
import type { EntityPosition } from "../../EntityPosition";
import type { ILayoutOptimizer } from "../ILayoutOptimizer";
import type { LayoutOptimizationContext }
	from "../LayoutOptimizationContext";


export class AlignmentOptimizer
	implements ILayoutOptimizer {


	readonly name =
		"AlignmentOptimizer";


	optimize(
		_graph: IGraph,
		snapshot: GraphSnapshot,
		context: LayoutOptimizationContext
	): GraphSnapshot {


		const positions =
			new Map<string, EntityPosition>(
				snapshot.positions
			);
		const structure =
			context.structure;


		if (!structure) {
			return {
				...snapshot,
				positions
			};
		}


		for (
			const chain
			of structure.mainChains
		) {

			this.alignChain(
				chain,
				positions
			);

		}





		return {
			...snapshot,
			positions
		};
	}
	private alignChain(
		chain: readonly string[],
		positions: Map<string, EntityPosition>
	): void {


		const nodes =
			chain
				.map(id =>
					positions.get(id)
				)
				.filter(
					(position): position is EntityPosition =>
						position !== undefined
				);


		if (nodes.length < 2) {
			return;
		}


		const centerX =
			nodes.reduce(
				(sum, node) =>
					sum +
					node.x +
					node.width / 2,
				0
			)
			/
			nodes.length;


		for (const id of chain) {

			const position =
				positions.get(id);


			if (!position) {
				continue;
			}


			positions.set(
				id,
				{
					...position,
					x:
						centerX -
						position.width / 2
				}
			);
		}
	}
}