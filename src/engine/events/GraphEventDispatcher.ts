import type { GraphEvent } from "./GraphEvent";
import type { IGraphListener } from "./IGraphListener";

export class GraphEventDispatcher {
	private readonly listeners = new Set<IGraphListener>();

	addListener(listener: IGraphListener): void {
		this.listeners.add(listener);
	}

	removeListener(listener: IGraphListener): void {
		this.listeners.delete(listener);
	}

	dispatch(event: GraphEvent): void {
		for (const listener of this.listeners) {
			listener.onGraphEvent(event);
		}
	}
}