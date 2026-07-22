import type { CanvasNodeHandle } from "../canvas/CanvasTypes";

export class SyncContext {
	private readonly entityNodeMap =
		new Map<string, CanvasNodeHandle>();

	getNode(
		entityId: string
	): CanvasNodeHandle | undefined {
		return this.entityNodeMap.get(entityId);
	}

	setNode(
		entityId: string,
		node: CanvasNodeHandle
	): void {
		this.entityNodeMap.set(entityId, node);
	}

	removeNode(
		entityId: string
	): void {
		this.entityNodeMap.delete(entityId);
	}

	clear(): void {
		this.entityNodeMap.clear();
	}

	get entries(): ReadonlyMap<
		string,
		CanvasNodeHandle
	> {
		return this.entityNodeMap;
	}
}