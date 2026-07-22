import type {
	CanvasHandle,
	CanvasNodeHandle
} from "./canvas/CanvasTypes";

export type FlowChainCanvas = CanvasHandle;
export type FlowChainCanvasNode = CanvasNodeHandle;

export interface ICanvasLocator {
	getActiveCanvas(): FlowChainCanvas | null;
}