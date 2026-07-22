import type { GraphEvent } from "./GraphEvent";

export interface IGraphListener {
	onGraphEvent(event: GraphEvent): void;
}