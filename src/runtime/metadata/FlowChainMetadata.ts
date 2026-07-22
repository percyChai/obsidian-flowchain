import type { PropertyValue } from "../../engine/types/PropertyValue";

export const FLOWCHAIN_METADATA_KEY = "flowchain";

export interface FlowChainNodeMetadata {
	entityId: string;

	entityType?: string;

	title?: string;

	sourcePath?: string;
}

export interface FlowChainCanvasMetadata {
	version: number;

	sourceFolderPath: string;

	layout: string;

	style: string;

	graph?: FlowChainGraphMetadata;
}

export interface FlowChainGraphMetadata {
	entities: FlowChainEntityMetadata[];
	relations: FlowChainRelationMetadata[];
}

export interface FlowChainEntityMetadata {
	id: string;
	type: string;
	title: string;
	properties: Record<string, PropertyValue>;
}

export interface FlowChainRelationMetadata {
	id: string;
	from: string;
	to: string;
	type: string;
	properties: Record<string, PropertyValue>;
}
