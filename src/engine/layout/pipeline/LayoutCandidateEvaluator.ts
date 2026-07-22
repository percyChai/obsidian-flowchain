import type { IGraph } from "../../graph/IGraph";
import type { GraphSnapshot } from "../GraphSnapshot";


export interface LayoutCandidateEvaluator {


	evaluate(
		graph: IGraph,
		snapshot: GraphSnapshot
	): number;

}