export interface CanvasPosition {
	x: number;
	y: number;
}

export interface CanvasSize {
	width: number;
	height: number;
}

export type CanvasSide =
	| "top"
	| "right"
	| "bottom"
	| "left";

export type CanvasEndType =
	| "none"
	| "arrow";

export interface CanvasNodeData
	extends Record<string, unknown> {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	type: string;
	text?: string;
	color?: string;
	borderColor?: string;
	textColor?: string;
}

export interface CanvasEdgeData
	extends Record<string, unknown> {
	id: string;
	fromNode: string;
	fromSide: CanvasSide;
	fromEnd?: CanvasEndType;
	toNode: string;
	toSide: CanvasSide;
	toEnd?: CanvasEndType;
	label?: string;
	color?: string;
	lineStyle?: string;
	width?: number;
}

export interface CanvasNodeHandle {
	readonly id: string;

	getData(): CanvasNodeData;

	setData(
		data: CanvasNodeData,
		addHistory?: boolean
	): void;
}

export interface CanvasEdgeHandle {
	readonly id: string;

	getData(): CanvasEdgeData;

	setData(
		data: CanvasEdgeData,
		addHistory?: boolean
	): void;
}

export interface CreateCanvasTextNodeOptions {
	position: CanvasPosition;
	size: CanvasSize;
	text: string;
	focus?: boolean;
}

export interface CanvasHandle {
	readonly nodes: Map<string, CanvasNodeHandle>;
	readonly edges: Map<string, CanvasEdgeHandle>;
	getData(): CanvasDocumentData;

	setData(data: CanvasDocumentData): void;
	createTextNode(
		options: {
			pos: CanvasPosition;
			size: CanvasSize;
			focus?: boolean;
		}
	): CanvasNodeHandle;

	removeNode(node: CanvasNodeHandle): void;

	removeEdge(edge: CanvasEdgeHandle): void;

	importData(
		data: {
			nodes: CanvasNodeData[];
			edges: CanvasEdgeData[];
		},
		clearCanvas?: boolean,
		silent?: boolean
	): void;

	requestSave(): void;

	zoomToFit?(): void;
}

export interface CanvasDocumentData {
	nodes: CanvasNodeData[];
	edges: CanvasEdgeData[];
	metadata?: Record<string, unknown>;
}
