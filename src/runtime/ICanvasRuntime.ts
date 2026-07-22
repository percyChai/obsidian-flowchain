import type { FlowChainCanvas } from "./ICanvasLocator";

export interface ICanvasRuntime {
	readonly isRunning: boolean;

	start(): Promise<void>;

	stop(): Promise<void>;

	getActiveCanvas(): FlowChainCanvas | null;

	getActiveCanvasKey(): string | null;
}
