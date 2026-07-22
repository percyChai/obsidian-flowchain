import {
	App,
	Modal,
	Setting
} from "obsidian";
import {
	LayoutType,
	type LayoutType as LayoutTypeValue
} from "../../engine/layout/LayoutType";

export const LayoutPickerSelection = {
	Recommendation: "recommendation"
} as const;

export type LayoutPickerSelection =
	| LayoutTypeValue
	| typeof LayoutPickerSelection.Recommendation;

interface LayoutOption {
	type: LayoutPickerSelection;
	name: string;
	description: string;
}

const LAYOUT_OPTIONS:
	readonly LayoutOption[] = [
		{
			type:
				LayoutPickerSelection
					.Recommendation,
			name: "智能推荐布局",
			description:
				"分析多种候选方案并排序，由你选择后应用。"
		},
		{
			type: LayoutType.Hierarchy,
			name: "层级布局",
			description:
				"按关系层级排列节点，适合分支、汇聚和上下游关系。"
		},
		{
			type:
				LayoutType.HierarchyClearPath,
			name:
				"层级布局-连线不穿过节点",
			description:
				"在层级布局基础上适当移动被无关连线穿过的节点，保持整体居中，允许连线交叉。"
		},
		{
			type: LayoutType.Tree,
			name: "树状布局",
			description:
				"按主要父子关系排列节点，适合清晰的树形结构。"
		},
		{
			type: LayoutType.Radial,
			name: "放射布局",
			description:
				"以核心节点为中心向外分层展开，适合查看关系扩散范围。"
		},
		{
			type: LayoutType.Force,
			name: "力导向布局",
			description:
				"根据节点排斥和关系吸引形成自然网络分布，适合复杂关系图。"
		},
		{
			type: LayoutType.Circular,
			name: "环形布局",
			description:
				"将循环关系和闭环知识链按圆周展开，适合查看环路和多个弱连通分量。"
		}
	];

class LayoutPickerModal extends Modal {
	private selectedLayout:
		LayoutPickerSelection | null = null;

	constructor(
		app: App,
		private readonly resolveSelection:
			(
				layoutType:
					LayoutPickerSelection | null
			) => void
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(
			"FlowChain：选择布局模式"
		);

		this.contentEl.empty();

		for (const option of LAYOUT_OPTIONS) {
			new Setting(this.contentEl)
				.setName(option.name)
				.setDesc(option.description)
				.addButton(button => {
					button
						.setButtonText("选择")
						.onClick(() => {
							this.selectedLayout =
								option.type;
							this.close();
						});
				});
		}
	}

	onClose(): void {
		this.contentEl.empty();
		this.resolveSelection(
			this.selectedLayout
		);
	}
}

export class LayoutPicker {
	constructor(
		private readonly app: App
	) {}

	pickLayout():
		Promise<LayoutPickerSelection | null> {
		return new Promise(resolve => {
			new LayoutPickerModal(
				this.app,
				resolve
			).open();
		});
	}
}
