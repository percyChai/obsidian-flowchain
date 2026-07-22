export const EdgeOrientation = {
	Vertical: "vertical",
	Horizontal: "horizontal",
	Radial: "radial"
} as const;

export type EdgeOrientation =
	(typeof EdgeOrientation)[keyof typeof EdgeOrientation];