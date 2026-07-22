import type { IRelation } from "./IRelation";
import type { PropertyValue } from "../types/PropertyValue";

export class Relation implements IRelation {
	constructor(
		public readonly id: string,
		public readonly from: string,
		public readonly to: string,
		public readonly type: string,
		public readonly properties: Record<string, PropertyValue> = {}
	) {}
}