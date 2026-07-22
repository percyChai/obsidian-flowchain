import type { ICanvasAdapter } from "../canvas/ICanvasAdapter";
import {
	FLOWCHAIN_METADATA_KEY,
	type FlowChainCanvasMetadata
} from "./FlowChainMetadata";

export class CanvasMetadataManager {
	constructor(
		private readonly canvasAdapter: ICanvasAdapter
	) {}

	getMetadata(): FlowChainCanvasMetadata | null {
		const canvasData =
			this.canvasAdapter.getCanvasData();

		if (!canvasData?.metadata) {
			return null;
		}

		const metadata =
			canvasData.metadata[
				FLOWCHAIN_METADATA_KEY
			];

		if (
			!metadata ||
			typeof metadata !== "object"
		) {
			return null;
		}

		return metadata as FlowChainCanvasMetadata;
	}

	setMetadata(
		metadata: FlowChainCanvasMetadata
	): boolean {
		const canvasData =
			this.canvasAdapter.getCanvasData();

		if (!canvasData) {
			return false;
		}

		return this.canvasAdapter.setCanvasData({
			...canvasData,
			metadata: {
				...(canvasData.metadata ?? {}),
				[FLOWCHAIN_METADATA_KEY]:
					metadata
			}
		});
	}
}