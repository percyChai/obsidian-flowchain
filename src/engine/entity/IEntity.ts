import type { EntityType } from "./EntityType";
import type { PropertyValue } from "../types/PropertyValue";

export interface IEntity {
	id: string;
	type: EntityType;
	title: string;
	properties: Record<string, PropertyValue>;
}