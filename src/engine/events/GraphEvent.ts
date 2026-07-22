import type { IEntity } from "../entity/IEntity";
import type { IRelation } from "../relation/IRelation";
import type { GraphEventType } from "./GraphEventType";

export interface GraphEvent {
	type: GraphEventType;
	entity?: IEntity;
	relation?: IRelation;
	entityId?: string;
	relationId?: string;
}