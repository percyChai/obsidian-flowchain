import type {
	CanvasEdgeData,
	CanvasEdgeHandle,
	CanvasHandle,
	CanvasNodeData,
	CanvasNodeHandle,
	CanvasDocumentData,
	CreateCanvasTextNodeOptions
} from "./CanvasTypes";

export interface ICanvasAdapter {
	getActiveCanvas(): CanvasHandle | null;

	getActiveCanvasKey(): string | null;

	withCanvas<T>(
		canvas: CanvasHandle,
		canvasKey: string,
		callback: () => T
	): T;

	getNodes(): readonly CanvasNodeHandle[];

	getEdges(): readonly CanvasEdgeHandle[];
	getCanvasData(): CanvasDocumentData | null;

	setCanvasData(data: CanvasDocumentData): boolean;
	createTextNode(
		options: CreateCanvasTextNodeOptions
	): CanvasNodeHandle | null;

	createEdge(
		data: CanvasEdgeData
	): CanvasEdgeHandle | null;

	updateNode(
		node: CanvasNodeHandle,
		data: CanvasNodeData
	): void;

	updateEdge(
		edge: CanvasEdgeHandle,
		data: CanvasEdgeData
	): void;

	removeNode(node: CanvasNodeHandle): void;

	removeEdge(edge: CanvasEdgeHandle): void;

	requestSave(): void;

	zoomToFit(): void;
}
