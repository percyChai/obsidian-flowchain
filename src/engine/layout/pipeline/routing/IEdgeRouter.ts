import type { IGraph } from "../../../graph/IGraph";
import type { GraphSnapshot } from "../../GraphSnapshot";
import type { EdgeRoute } from "./EdgeRoute";

export interface IEdgeRouter {
	route(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, EdgeRoute>;
}