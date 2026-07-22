import type { TFile } from "obsidian";
import type { MarkdownDocument } from "../../engine/parser/MarkdownDocument";

export interface IMarkdownDocumentLoader {
	load(file: TFile): Promise<MarkdownDocument>;

	loadMany(files: TFile[]): Promise<MarkdownDocument[]>;
}