import type { TFile } from "obsidian";

export interface IVaultScanner {
	getMarkdownFiles(
		folderPath?: string
	): TFile[];
}