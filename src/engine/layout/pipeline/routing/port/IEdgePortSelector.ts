import type { EntityPosition } from "../../../EntityPosition";
import type { EdgeOrientation } from "../semantic/EdgeOrientation";
import type { EdgePorts } from "./EdgePorts";

export interface IEdgePortSelector {
	select(
		orientation: EdgeOrientation,
		from: EntityPosition,
		to: EntityPosition
	): EdgePorts;
}