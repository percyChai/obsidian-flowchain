import type { IGraph } from "../../../../graph/IGraph";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import type { EdgeRoute } from "../EdgeRoute";
import type { EdgePath } from "./EdgePath";

export interface IEdgePathRouter {
	route(
		graph: IGraph,
		snapshot: GraphSnapshot,
		routes: ReadonlyMap<string, EdgeRoute>
	): Map<string, EdgePath>;
}