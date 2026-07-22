import { ItemView, type App } from "obsidian";
import type {
	FlowChainCanvas,
	ICanvasLocator
} from "./ICanvasLocator";

interface CanvasView extends ItemView {
	canvas: FlowChainCanvas;
}

export class CanvasLocator implements ICanvasLocator {
	constructor(
		private readonly app: App
	) {}

	getActiveCanvas(): FlowChainCanvas | null {
		const activeView =
			this.app.workspace.activeLeaf?.view;

		if (!activeView) {
			return null;
		}

		if (activeView.getViewType() !== "canvas") {
			return null;
		}

		const canvasView = activeView as CanvasView;

		return canvasView.canvas ?? null;
	}
}