import type { IGraph } from "../../engine/graph/IGraph";
import type { SyncContext } from "./SyncContext";
import type { GraphSnapshot } from "../../engine/layout/GraphSnapshot";
export interface IEdgeSync {
	sync(
		graph: IGraph,
		snapshot: GraphSnapshot,
		context: SyncContext
	): void;
}