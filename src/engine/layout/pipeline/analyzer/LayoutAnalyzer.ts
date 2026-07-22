import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { ILayoutAnalyzer } from "./ILayoutAnalyzer";
import type { LayoutProblem } from "./LayoutProblem";

export class LayoutAnalyzer
	implements ILayoutAnalyzer {

	analyze(
		graph: IGraph,
		snapshot: GraphSnapshot
	): LayoutProblem[] {

		void graph;
		void snapshot;

		/*
		 * 第一版 Analyzer 暂不分析任何问题。
		 *
		 * 后续会逐步加入：
		 *
		 * 1. Relationship Ambiguity
		 * 2. Hierarchy Ambiguity
		 * 3. Node Overlap
		 * 4. Graph Imbalance
		 * 5. Edge Crossing
		 */

		return [];
	}
}