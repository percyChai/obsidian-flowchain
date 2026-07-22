import type { App, TFile } from "obsidian";
import type { IVaultScanner } from "./IVaultScanner";

export class VaultScanner
	implements IVaultScanner {

	constructor(
		private readonly app: App
	) {}

	getMarkdownFiles(
		folderPath?: string
	): TFile[] {

		const files =
			this.app.vault.getMarkdownFiles();

		if (!folderPath) {
			return files;
		}

		return files.filter(file =>
			file.path.startsWith(
				folderPath + "/"
			)
		);
	}
}