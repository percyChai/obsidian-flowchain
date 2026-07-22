import type { IGraph } from "../../graph/IGraph";
import type { GraphSnapshot } from "../GraphSnapshot";
import type { LayoutOptimizationContext }
	from "./LayoutOptimizationContext";
export interface ILayoutOptimizer {
	optimize(
	graph: IGraph,
	snapshot: GraphSnapshot,
	context: LayoutOptimizationContext
): GraphSnapshot;
}