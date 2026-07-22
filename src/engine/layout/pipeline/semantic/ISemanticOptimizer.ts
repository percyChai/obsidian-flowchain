import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { LayoutProblem } from "../analyzer/LayoutProblem";

export interface ISemanticOptimizer {
	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot,
		problems: readonly LayoutProblem[]
	): GraphSnapshot;
}