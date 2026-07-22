import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";

export interface IRoutingOptimizer {
	optimize(
		graph: IGraph,
		snapshot: GraphSnapshot
	): GraphSnapshot;
}