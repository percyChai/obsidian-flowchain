import type { App } from "obsidian";
import { GraphBuilder } from "../engine/graph/GraphBuilder";
import type { IGraph } from "../engine/graph/IGraph";
import { MarkdownParser } from "../engine/parser/MarkdownParser";
import { MarkdownDocumentLoader } from "../parser/vault/MarkdownDocumentLoader";
import { VaultScanner } from "../parser/vault/VaultScanner";

export async function buildGraphFromFolder(
	app: App,
	folderPath: string
): Promise<{
	graph: IGraph;
	fileCount: number;
}> {
	const scanner =
		new VaultScanner(app);
	const files =
		scanner.getMarkdownFiles(
			folderPath
		);

	if (files.length === 0) {
		return {
			graph:
				new GraphBuilder(
					new MarkdownParser()
				).build([]),
			fileCount: 0
		};
	}

	const loader =
		new MarkdownDocumentLoader(app);
	const documents =
		await loader.loadMany(files);
	const parser =
		new MarkdownParser();
	const builder =
		new GraphBuilder(parser);

	return {
		graph:
			builder.build(documents),
		fileCount: files.length
	};
}
