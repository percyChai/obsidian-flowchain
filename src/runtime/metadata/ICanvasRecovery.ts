import type { SyncContext } from "../sync/SyncContext";

export interface ICanvasRecovery {
	recover(context: SyncContext): void;
}