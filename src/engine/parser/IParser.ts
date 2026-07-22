import type { MarkdownDocument } from "./MarkdownDocument";
import type { ParsedGraphData } from "./ParsedGraphData";

export interface IParser {
	parse(document: MarkdownDocument): ParsedGraphData;
}