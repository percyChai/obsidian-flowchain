import type { GraphSnapshot }
	from "../../GraphSnapshot";

import type { LayoutOptimizationContext }
	from "../LayoutOptimizationContext";


export class BackboneEvaluator {


	evaluate(
		snapshot: GraphSnapshot,
		context: LayoutOptimizationContext
	): number {


		const chains =
			context.structure?.mainChains;


		if (!chains || chains.length === 0) {
			return 0;
		}


		let score = 0;


		for (const chain of chains) {


			for (
				let i = 1;
				i < chain.length;
				i++
			) {


				const previous =
					snapshot.positions.get(
						chain[i - 1]!
					);


				const current =
					snapshot.positions.get(
						chain[i]!
					);


				if (
					!previous ||
					!current
				) {
					continue;
				}


				const distance =
					Math.abs(
						(
							previous.x +
							previous.width / 2
						)
						-
						(
							current.x +
							current.width / 2
						)
					);


				score -= distance * 0.01;

			}

		}


		return score;
	}

}