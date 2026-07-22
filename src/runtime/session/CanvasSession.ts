import type { CanvasHandle } from "../canvas/CanvasTypes";
import { SyncContext } from "../sync/SyncContext";

export class CanvasSession {
	readonly context = new SyncContext();

	private recovered = false;

	constructor(
		readonly canvas: CanvasHandle,
		public canvasPath: string
	) {}

	get isRecovered(): boolean {
		return this.recovered;
	}

	markRecovered(): void {
		this.recovered = true;
	}

	reset(): void {
		this.context.clear();
		this.recovered = false;
	}
}
