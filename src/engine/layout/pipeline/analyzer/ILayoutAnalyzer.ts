import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { LayoutProblem } from "./LayoutProblem";

export interface ILayoutAnalyzer {
	analyze(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutProblem[];
}