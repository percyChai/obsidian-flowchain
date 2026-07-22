export const LayoutType = { 
	Hierarchy: "hierarchy",
	HierarchyClearPath: "hierarchy-clear-path",
	Tree: "tree",
	Radial: "radial",
	Force: "force",
	Circular: "circular"
} as const;


export type LayoutType =
	typeof LayoutType[keyof typeof LayoutType];
