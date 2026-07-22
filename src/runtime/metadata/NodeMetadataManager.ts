import {
	FLOWCHAIN_METADATA_KEY,
	type FlowChainNodeMetadata
} from "./FlowChainMetadata";
import type { IEntity } from "../../engine/entity/IEntity";

export class NodeMetadataManager {
	getNodeMetadata(
		data: Record<string, unknown>
	): FlowChainNodeMetadata | null {
		const metadata =
			data[FLOWCHAIN_METADATA_KEY];

		if (
			!metadata ||
			typeof metadata !== "object"
		) {
			return null;
		}

		return metadata as FlowChainNodeMetadata;
	}

	setNodeMetadata<
		T extends Record<string, unknown>
	>(
		data: T,
		entity: IEntity
	): T & {
		[FLOWCHAIN_METADATA_KEY]:
			FlowChainNodeMetadata;
	} {
		return {
			...data,
			[FLOWCHAIN_METADATA_KEY]: {
				entityId: entity.id,
				entityType: entity.type,
				title: entity.title,
				sourcePath:
					typeof entity.properties.sourcePath ===
					"string"
						? entity.properties.sourcePath
						: undefined
			}
		};
	}
}
