export const LayoutProblemType = {
	NodeOverlap: "node-overlap",
	RelationshipAmbiguity:
		"relationship-ambiguity",
	HierarchyAmbiguity:
		"hierarchy-ambiguity",
	GraphImbalance:
		"graph-imbalance",
	EdgeCrossing:
		"edge-crossing"
} as const;

export type LayoutProblemType =
	(typeof LayoutProblemType)[keyof typeof LayoutProblemType];

export interface LayoutProblem {
	type: LayoutProblemType;

	entityIds: readonly string[];

	message: string;
}