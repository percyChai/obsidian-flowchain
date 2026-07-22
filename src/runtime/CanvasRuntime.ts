import type { App } from "obsidian";
import { CanvasLocator } from "./CanvasLocator";
import type { ICanvasRuntime } from "./ICanvasRuntime";
import type { FlowChainCanvas } from "./ICanvasLocator";

export class CanvasRuntime implements ICanvasRuntime {
	private running = false;
	private readonly canvasLocator: CanvasLocator;

	constructor(
		private readonly app: App
	) {
		this.canvasLocator = new CanvasLocator(app);
	}

	get isRunning(): boolean {
		return this.running;
	}

	async start(): Promise<void> {
		if (this.running) {
			return;
		}

		this.running = true;
	}

	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}

		this.running = false;
	}

	getActiveCanvas(): FlowChainCanvas | null {
		if (!this.running) {
			return null;
		}

		return this.canvasLocator.getActiveCanvas();
	}

	getActiveCanvasKey(): string | null {
		if (!this.running) {
			return null;
		}

		const file =
			this.app.workspace.getActiveFile();

		if (!file || file.extension !== "canvas") {
			return null;
		}

		return file.path;
	}
}
