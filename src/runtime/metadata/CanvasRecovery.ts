import type { ICanvasAdapter } from "../canvas/ICanvasAdapter";
import type { SyncContext } from "../sync/SyncContext";
import type { ICanvasRecovery } from "./ICanvasRecovery";
import { NodeMetadataManager } from "./NodeMetadataManager";

export class CanvasRecovery implements ICanvasRecovery {
	private readonly metadataManager =
		new NodeMetadataManager();

	constructor(
		private readonly canvasAdapter: ICanvasAdapter
	) {}

	recover(context: SyncContext): void {
		context.clear();

		for (const node of this.canvasAdapter.getNodes()) {
			const metadata =
				this.metadataManager.getNodeMetadata(
					node.getData()
				);

			if (!metadata?.entityId) {
				continue;
			}

			context.setNode(
				metadata.entityId,
				node
			);
		}
	}
}