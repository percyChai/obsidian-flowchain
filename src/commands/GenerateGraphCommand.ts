import {
	Notice,
	type App,
	type TFile
} from "obsidian";
import { LayoutManager } from "../engine/layout/LayoutManager";
import { LayoutType } from "../engine/layout/LayoutType";
import type { ICanvasSync } from "../runtime/sync/ICanvasSync";
import { buildGraphFromFolder } from "./GraphCommandHelpers";
import { FolderPicker } from "./folder/FolderPicker";
import type { IGenerateGraphCommand } from "./IGenerateGraphCommand";

export class GenerateGraphCommand
	implements IGenerateGraphCommand {

	constructor(
		private readonly app: App,
		private readonly canvasSync: ICanvasSync
	) {}

	async execute(): Promise<void> {
		const context =
			this.canvasSync
				.captureOperationContext();
		const canvasFile =
			this.getActiveCanvasFile();

		if (!context || !canvasFile) {
			new Notice(
				"FlowChain：请先打开一个 Canvas，再生成关系图。"
			);
			return;
		}

		const folderPath =
			await new FolderPicker(this.app)
				.pickFolder();

		if (folderPath === null) {
			return;
		}

		const canvasBaseName =
			this.createCanvasBaseName(
				folderPath
			);

		try {
			const { graph, fileCount } =
				await buildGraphFromFolder(
					this.app,
					folderPath
				);

			if (
				fileCount === 0 ||
				graph.entities.size === 0
			) {
				new Notice(
					"FlowChain：选择范围内没有有效 Markdown 节点。"
				);
				return;
			}

			const layoutType =
				LayoutType.Hierarchy;
			const snapshot =
				new LayoutManager()
					.generate(
						graph,
						layoutType
					);
			const generated =
				this.canvasSync.generate(
					context,
					graph,
					snapshot,
					folderPath
				);

			if (!generated) {
				new Notice(
					"FlowChain：Canvas 写入失败，关系图未生成。"
				);
				return;
			}

			try {
				const renamedFile =
					await this.renameCanvasFile(
						canvasFile,
						canvasBaseName
					);

				this.canvasSync
					.migrateOperationContext(
						context,
						renamedFile.path
					);

				new Notice(
					this.createSuccessNotice(
						renamedFile.basename,
						layoutType,
						graph.entities.size,
						graph.relations.size
					)
				);
			} catch (renameError) {
				console.error(
					"FlowChain canvas rename failed.",
					renameError
				);
				new Notice(
					this.createRenameFailedNotice(
						canvasFile.basename,
						layoutType,
						graph.entities.size,
						graph.relations.size
					)
				);
			}
		} catch (error) {
			console.error(
				"FlowChain generate failed.",
				error
			);
			new Notice(
				"FlowChain：生成关系图失败，请检查 Markdown 内容。"
			);
		}
	}

	private getActiveCanvasFile():
		TFile | null {
		const file =
			this.app.workspace
				.getActiveFile();

		if (!file || file.extension !== "canvas") {
			return null;
		}

		return file;
	}

	private createCanvasBaseName(
		folderPath: string
	): string {
		if (folderPath.length === 0) {
			return "全部文件";
		}

		const normalizedPath =
			folderPath.replace(/\\/g, "/");
		const folderName =
			normalizedPath
				.split("/")
				.filter(
					(part) =>
						part.length > 0
				)
				.pop() ?? "";

		return this.sanitizeFileName(
			folderName
		);
	}

	private sanitizeFileName(
		fileName: string
	): string {
		const sanitized =
			fileName
				.replace(/[/\\:*?"<>|]/g, "")
				.trim();

		return sanitized.length > 0
			? sanitized
			: "FlowChain关系图";
	}

	private async renameCanvasFile(
		file: TFile,
		baseName: string
	): Promise<TFile> {
		const targetPath =
			await this.createAvailableCanvasPath(
				file,
				baseName
			);

		if (targetPath === file.path) {
			return file;
		}

		await this.app.fileManager.renameFile(
			file,
			targetPath
		);

		const renamedFile =
			this.app.vault
				.getAbstractFileByPath(
					targetPath
				);

		if (
			renamedFile &&
			"extension" in renamedFile &&
			renamedFile.extension === "canvas"
		) {
			return renamedFile as TFile;
		}

		return file;
	}

	private async createAvailableCanvasPath(
		file: TFile,
		baseName: string
	): Promise<string> {
		const parentPath =
			file.parent?.path ?? "";

		for (let index = 0; ; index++) {
			const candidateName =
				index === 0
					? baseName
					: `${baseName}${index}`;
			const candidatePath =
				parentPath.length > 0
					? `${parentPath}/${candidateName}.canvas`
					: `${candidateName}.canvas`;

			if (candidatePath === file.path) {
				return candidatePath;
			}

			if (
				!(await this.canvasPathExists(
					candidatePath
				))
			) {
				return candidatePath;
			}
		}
	}

	private async canvasPathExists(
		path: string
	): Promise<boolean> {
		if (
			this.app.vault
				.getAbstractFileByPath(path)
		) {
			return true;
		}

		return this.app.vault.adapter.exists(
			path
		);
	}

	private createSuccessNotice(
		canvasName: string,
		layoutType: LayoutType,
		nodeCount: number,
		relationCount: number
	): string {
		return [
			"FlowChain：关系图已生成",
			`Canvas: ${canvasName}`,
			`布局：${this.getLayoutName(layoutType)}`,
			`节点数量：${nodeCount}个`,
			`关系数量：${relationCount}条`
		].join("\n");
	}

	private createRenameFailedNotice(
		canvasName: string,
		layoutType: LayoutType,
		nodeCount: number,
		relationCount: number
	): string {
		return [
			"FlowChain：关系图已生成，但 Canvas 重命名失败",
			`Canvas: ${canvasName}`,
			`布局：${this.getLayoutName(layoutType)}`,
			`节点数量：${nodeCount}个`,
			`关系数量：${relationCount}条`
		].join("\n");
	}

	private getLayoutName(
		layoutType: LayoutType
	): string {
		switch (layoutType) {
			case LayoutType.Tree:
				return "树状布局";
			case LayoutType.Radial:
				return "放射布局";
			case LayoutType.Force:
				return "力导向布局";
			case LayoutType.Hierarchy:
			default:
				return "层级布局";
		}
	}
}
