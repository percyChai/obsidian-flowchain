import type { ICanvasRuntime } from "../ICanvasRuntime";
import type {
	CanvasEdgeData,
	CanvasEdgeHandle,
	CanvasHandle,
	CanvasNodeData,
	CanvasNodeHandle,
	CanvasDocumentData,
	CreateCanvasTextNodeOptions
} from "./CanvasTypes";
import type { ICanvasAdapter } from "./ICanvasAdapter";

export class CanvasAdapter implements ICanvasAdapter {
	private overrideContext:
		| {
			canvas: CanvasHandle;
			canvasKey: string;
		}
		| null = null;

	constructor(
		private readonly runtime: ICanvasRuntime
	) { }

	getActiveCanvas(): CanvasHandle | null {
		if (this.overrideContext) {
			return this.overrideContext.canvas;
		}

		return this.runtime.getActiveCanvas();
	}

	getActiveCanvasKey(): string | null {
		if (this.overrideContext) {
			return this.overrideContext.canvasKey;
		}

		return this.runtime.getActiveCanvasKey();
	}

	withCanvas<T>(
		canvas: CanvasHandle,
		canvasKey: string,
		callback: () => T
	): T {
		const previousContext =
			this.overrideContext;

		this.overrideContext = {
			canvas,
			canvasKey
		};

		try {
			return callback();
		} finally {
			this.overrideContext =
				previousContext;
		}
	}

	getNodes(): readonly CanvasNodeHandle[] {
		const canvas = this.getActiveCanvas();

		if (!canvas) {
			return [];
		}

		return Array.from(canvas.nodes.values());
	}

	getEdges(): readonly CanvasEdgeHandle[] {
		const canvas = this.getActiveCanvas();

		if (!canvas) {
			return [];
		}

		return Array.from(canvas.edges.values());
	}

	createTextNode(
		options: CreateCanvasTextNodeOptions
	): CanvasNodeHandle | null {
		const canvas = this.getActiveCanvas();

		if (!canvas) {
			return null;
		}

		const node = canvas.createTextNode({
			pos: options.position,
			size: options.size,
			focus: options.focus ?? false
		});

		node.setData({
			...node.getData(),
			text: options.text
		});

		return node;
	}

	createEdge(
		data: CanvasEdgeData
	): CanvasEdgeHandle | null {
		const canvas = this.getActiveCanvas();

		if (!canvas) {
			return null;
		}

		canvas.importData(
			{
				nodes: [],
				edges: [data]
			},
			false,
			false
		);

		return canvas.edges.get(data.id) ?? null;
	}

	updateNode(
		node: CanvasNodeHandle,
		data: CanvasNodeData
	): void {
		node.setData(data);
	}

	updateEdge(
		edge: CanvasEdgeHandle,
		data: CanvasEdgeData
	): void {
		edge.setData(data);
	}

	removeNode(node: CanvasNodeHandle): void {
		this.getActiveCanvas()?.removeNode(node);
	}

	removeEdge(edge: CanvasEdgeHandle): void {
		this.getActiveCanvas()?.removeEdge(edge);
	}

	requestSave(): void {
		this.getActiveCanvas()?.requestSave();
	}

	zoomToFit(): void {
		const canvas = this.getActiveCanvas();

		canvas?.zoomToFit?.();
	}

	getCanvasData(): CanvasDocumentData | null {
		return this.getActiveCanvas()?.getData() ?? null;
	}

	setCanvasData(
		data: CanvasDocumentData
	): boolean {
		const canvas = this.getActiveCanvas();

		if (!canvas) {
			return false;
		}

		canvas.setData(data);
		canvas.requestSave();

		return true;
	}
}
