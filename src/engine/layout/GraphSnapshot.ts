import type { EntityPosition } from "./EntityPosition";
import type { EdgeRoute } from "./pipeline/routing/EdgeRoute";
import type { EdgePath } from "./pipeline/routing/path/EdgePath";
export interface GraphSnapshot {
	positions: ReadonlyMap<string, EntityPosition>;
	expandedEntityIds: ReadonlySet<string>;
	collapsedEntityIds: ReadonlySet<string>;
	selectedEntityIds: ReadonlySet<string>;
	routes: ReadonlyMap<string, EdgeRoute>;
	paths: ReadonlyMap<string, EdgePath>;
}