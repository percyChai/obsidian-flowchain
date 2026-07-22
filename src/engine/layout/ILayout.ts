import type { IGraph } from "../graph/IGraph";
import type { GraphSnapshot } from "./GraphSnapshot";

export interface ILayout {
	generate(graph: IGraph): GraphSnapshot;
}