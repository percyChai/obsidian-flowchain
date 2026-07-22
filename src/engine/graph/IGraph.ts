import type { IEntity } from "../entity/IEntity";
import type { IGraphListener } from "../events/IGraphListener";
import type { IRelation } from "../relation/IRelation";

export interface IGraph {
	readonly entities: ReadonlyMap<string, IEntity>;
	readonly relations: ReadonlyMap<string, IRelation>;

	getEntity(id: string): IEntity | undefined;
	getRelation(id: string): IRelation | undefined;

	addEntity(entity: IEntity): void;
	updateEntity(entity: IEntity): void;
	removeEntity(id: string): void;

	addRelation(relation: IRelation): void;
	updateRelation(relation: IRelation): void;
	removeRelation(id: string): void;

	addListener(listener: IGraphListener): void;
	removeListener(listener: IGraphListener): void;
}