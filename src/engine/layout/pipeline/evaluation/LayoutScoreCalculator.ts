import type { IGraph }
	from "../../../graph/IGraph";
import type { GraphSnapshot }
	from "../../GraphSnapshot";
import { EdgeCrossingEvaluator }
	from "../evaluator/EdgeCrossingEvaluator";

import type { LayoutScore }
	from "./LayoutScore";
import { BackboneEvaluator }
	from "./BackboneEvaluator";
import type { LayoutOptimizationContext }
	from "../LayoutOptimizationContext";
import { LayoutScoreProfiles }
	from "./LayoutScoreProfiles";
import type { LayoutValidationIssue }
	from "../LayoutValidationIssue";

export class LayoutScoreCalculator {


	private readonly crossingEvaluator =
		new EdgeCrossingEvaluator();
	private readonly backboneEvaluator =
		new BackboneEvaluator();
	private readonly weights =
	LayoutScoreProfiles.Medical;

	calculate(
		graph: IGraph,
		snapshot: GraphSnapshot,
		context: LayoutOptimizationContext,
		issues:
			readonly LayoutValidationIssue[] = []
	): LayoutScore {


		const crossing =
			this.crossingEvaluator.evaluate(
				graph,
				snapshot
			);


		const compactness =
			this.calculateCompactness(
				snapshot
			);


		const edgeLength =
			this.calculateEdgeLength(
				snapshot
			);


		const balance =
			this.calculateBalance(
				snapshot
			);
		const backbone =
			this.backboneEvaluator.evaluate(
				snapshot,
				context
			);
		const nodeOverlap =
			issues.filter(
				(issue) =>
					issue.code === "node-overlap"
			).length;
		const edgeNodeIntersection =
			issues.filter(
				(issue) =>
					issue.code ===
					"edge-node-intersection"
			).length;
		const area =
			this.calculateArea(snapshot);
		const validationPenalty =
			nodeOverlap * 250 +
			edgeNodeIntersection * 140;


		const total =
	1000
	-
	crossing *
	this.weights.crossing

	-
	compactness *
	this.weights.compactness

	-
	edgeLength *
	this.weights.edgeLength

	+
	balance *
	this.weights.balance

	+
	backbone *
	this.weights.backbone

	-
	validationPenalty;



		return {

			total,

			crossing,

			compactness,

			balance,

			edgeLength,

			backbone,

			nodeOverlap,

			edgeNodeIntersection,

			area,

			validationPenalty

		};
	}




	private calculateCompactness(
		snapshot: GraphSnapshot
	): number {

		const positions =
			Array.from(
				snapshot.positions.values()
			);


		if (
			positions.length === 0
		) {
			return 0;
		}


		const left =
			Math.min(
				...positions.map(
					p => p.x
				)
			);


		const right =
			Math.max(
				...positions.map(
					p =>
						p.x + p.width
				)
			);


		return right - left;
	}




	private calculateEdgeLength(
		snapshot: GraphSnapshot
	): number {

		let length = 0;


		for (
			const path
			of snapshot.paths.values()
		) {


			for (
				let i = 1;
				i < path.points.length;
				i++
			) {

				const a =
					path.points[i - 1];

				const b =
					path.points[i];


				if (!a || !b) {
					continue;
				}


				length += Math.hypot(
					b.x - a.x,
					b.y - a.y
				);

			}

		}


		return length;
	}




	private calculateBalance(
		snapshot: GraphSnapshot
	): number {


		const positions =
			Array.from(
				snapshot.positions.values()
			);


		if (
			positions.length === 0
		) {
			return 0;
		}


		const center =
			positions.reduce(
				(sum, p) =>
					sum +
					p.x +
					p.width / 2,
				0
			)
			/
			positions.length;



		const deviation =
			positions.reduce(
				(sum, p) =>
					sum +
					Math.abs(
						(
							p.x +
							p.width / 2
						)
						-
						center
					),
				0
			);



		return -deviation * 0.01;
	}

	private calculateArea(
		snapshot: GraphSnapshot
	): number {
		const positions =
			Array.from(
				snapshot.positions.values()
			);

		if (positions.length === 0) {
			return 0;
		}

		const left =
			Math.min(
				...positions.map(
					p => p.x
				)
			);
		const right =
			Math.max(
				...positions.map(
					p => p.x + p.width
				)
			);
		const top =
			Math.min(
				...positions.map(
					p => p.y
				)
			);
		const bottom =
			Math.max(
				...positions.map(
					p => p.y + p.height
				)
			);

		return (
			Math.max(0, right - left) *
			Math.max(0, bottom - top)
		);
	}

}
