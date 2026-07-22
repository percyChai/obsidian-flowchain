export type EdgePort =
	| "top"
	| "right"
	| "bottom"
	| "left";

export interface EdgeRoute {
	relationId: string;

	fromPort: EdgePort;

	toPort: EdgePort;
}