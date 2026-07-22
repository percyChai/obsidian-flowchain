import type { IEntity } from "../entity/IEntity";
import type { IRelation } from "../relation/IRelation";

export interface ParsedGraphData {
	entities: IEntity[];
	relations: IRelation[];
}