import type { CanvasEndType } from "../canvas/CanvasTypes";

export type EdgeLineStyle =
	| "solid"
	| "dashed";

export interface EdgeStyle {
	color: string;
	fromEnd: CanvasEndType;
	toEnd: CanvasEndType;
	lineStyle: EdgeLineStyle;
	width: number;
}
