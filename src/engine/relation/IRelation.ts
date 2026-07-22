import type { PropertyValue } from "../types/PropertyValue";

export interface IRelation {
	id: string;
	from: string;
	to: string;
	type: string;
	properties: Record<string, PropertyValue>;
}