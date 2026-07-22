import type { EntityType } from "./EntityType";
import type { IEntity } from "./IEntity";
import type { PropertyValue } from "../types/PropertyValue";

export class Entity implements IEntity {
	constructor(
		public readonly id: string,
		public readonly type: EntityType,
		public readonly title: string,
		public readonly properties:
			Record<string, PropertyValue> = {}
	) {}
}