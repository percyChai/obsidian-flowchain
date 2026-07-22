import type { App, TFile } from "obsidian";
import type { MarkdownDocument } from "../../engine/parser/MarkdownDocument";
import type { IMarkdownDocumentLoader } from "./IMarkdownDocumentLoader";

export class MarkdownDocumentLoader
	implements IMarkdownDocumentLoader {

	constructor(
		private readonly app: App
	) {}

	async load(
		file: TFile
	): Promise<MarkdownDocument> {
		const content =
			await this.app.vault.cachedRead(file);

		return {
			path: file.path,
			content
		};
	}

	async loadMany(
		files: TFile[]
	): Promise<MarkdownDocument[]> {
		return Promise.all(
			files.map((file) => this.load(file))
		);
	}
}