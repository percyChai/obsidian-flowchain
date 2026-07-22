import type { IGraph } from "./IGraph";
import type { MarkdownDocument } from "../parser/MarkdownDocument";

export interface IGraphBuilder {
	build(documents: MarkdownDocument[]): IGraph;
}