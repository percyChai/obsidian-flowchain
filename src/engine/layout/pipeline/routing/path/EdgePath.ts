import type { EdgePathPoint } from "./EdgePathPoint";

export interface EdgePath {
	relationId: string;

	points: readonly EdgePathPoint[];
}