import type { IEntity } from "../entity/IEntity";
import type { IRelation } from "../relation/IRelation";

export interface IGraphQuery {
	findEntity(id: string): IEntity | undefined;

	findParents(entityId: string): IEntity[];

	findChildren(entityId: string): IEntity[];

	findNeighbors(entityId: string): IEntity[];

	findIncomingRelations(entityId: string): IRelation[];

	findOutgoingRelations(entityId: string): IRelation[];

	findPath(fromId: string, toId: string): IEntity[];
}