import type { IGraph } from "../../../../graph/IGraph";
import type { GraphSnapshot } from "../../../GraphSnapshot";
import type { SemanticEdgeRoute } from "./SemanticEdgeRoute";

export interface ISemanticEdgeRouter {
	route(
		graph: IGraph,
		snapshot: GraphSnapshot
	): Map<string, SemanticEdgeRoute>;
}