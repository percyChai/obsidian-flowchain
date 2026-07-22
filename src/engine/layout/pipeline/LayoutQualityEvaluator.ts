import type { IGraph } from "../../graph/IGraph";
import type { GraphSnapshot } from "../GraphSnapshot";
import { LayoutScoreCalculator } from "./evaluation/LayoutScoreCalculator";
import type { LayoutOptimizationContext }
	from "./LayoutOptimizationContext";
import type { LayoutValidationIssue }
	from "./LayoutValidationIssue";
import type { LayoutScore }
	from "./evaluation/LayoutScore";

export class LayoutQualityEvaluator {


	private readonly scoreCalculator =
		new LayoutScoreCalculator();



	evaluate(
		graph: IGraph,
		snapshot: GraphSnapshot,
		context: LayoutOptimizationContext,
		issues:
			readonly LayoutValidationIssue[] = []
	): number {


		const layoutScore =
			this.scoreCalculator.calculate(
			graph,
			snapshot,
			context,
			issues
		);


		return layoutScore.total;
	}

	evaluateDetailed(
		graph: IGraph,
		snapshot: GraphSnapshot,
		context: LayoutOptimizationContext,
		issues:
			readonly LayoutValidationIssue[] = []
	): LayoutScore {
		return this.scoreCalculator.calculate(
			graph,
			snapshot,
			context,
			issues
		);
	}

}
