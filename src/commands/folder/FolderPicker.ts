import {
	App,
	FuzzySuggestModal,
	TFolder
} from "obsidian";
import type { IFolderPicker } from "./IFolderPicker";

interface FolderOption {
	label: string;
	path: string;
}

class FolderSuggestModal extends FuzzySuggestModal<FolderOption> {
	private selectedPath: string | null = null;
	private finished = false;

	constructor(
		app: App,
		private readonly finish:
			(folderPath: string | null) => void
	) {
		super(app);

		this.setPlaceholder(
			"请选择需要生成关系图的范围"
		);
	}

	getItems(): FolderOption[] {
		const options: FolderOption[] = [
			{
				label: "全部",
				path: ""
			}
		];

		for (const child of this.app.vault.getRoot().children) {
			if (!(child instanceof TFolder)) {
				continue;
			}

			options.push({
				label: child.name,
				path: child.path
			});
		}

		return options;
	}

	getItemText(option: FolderOption): string {
		return option.label;
	}

	onChooseItem(option: FolderOption): void {
		// 这里只记录选择，不立即继续生成流程。
		this.selectedPath = option.path;
	}

	onClose(): void {
		super.onClose();

		if (this.finished) {
			return;
		}

		this.finished = true;

		// 等待 Obsidian 把活动视图恢复为 Canvas。
		window.setTimeout(() => {
			this.finish(this.selectedPath);
		}, 0);
	}
}

export class FolderPicker implements IFolderPicker {
	constructor(
		private readonly app: App
	) {}

	pickFolder(): Promise<string | null> {
		return new Promise((resolve) => {
			new FolderSuggestModal(
				this.app,
				resolve
			).open();
		});
	}
}