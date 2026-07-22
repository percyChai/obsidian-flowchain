import type { IEntity } from "../../engine/entity/IEntity";
import type { IGraph } from "../../engine/graph/IGraph";
import type { IRelation } from "../../engine/relation/IRelation";
import type {
	CanvasEdgeData,
	CanvasNodeData
} from "../canvas/CanvasTypes";
import type { EdgeStyle } from "./EdgeStyle";
import type { NodeStyle } from "./NodeStyle";
import {
	CLASSIC_STYLE_PALETTE,
	type StylePalette
} from "./StylePalette";

export const FLOWCHAIN_STYLE_KEY =
	"flowchainStyle";

export class StyleManager {
	constructor(
		private readonly palette:
			StylePalette =
				CLASSIC_STYLE_PALETTE
	) {}

	get theme(): string {
		return this.palette.theme;
	}

	getNodeStyle(
		entity: IEntity,
		nodeStyleMap?: ReadonlyMap<string, NodeStyle>
	): NodeStyle {
		const mappedStyle =
			nodeStyleMap?.get(
				this.createTypeKey(entity.type)
			);

		if (mappedStyle) {
			return mappedStyle;
		}

		return this.palette.nodes[
			this.normalizeEntityType(entity.type)
		];
	}

	createNodeStyleMap(
		graph: IGraph
	): Map<string, NodeStyle> {
		const typeKeys =
			Array.from(
				new Set(
					Array.from(
						graph.entities.values()
					).map((entity) =>
						this.createTypeKey(
							entity.type
						)
					)
				)
			).sort((first, second) =>
				first.localeCompare(second)
			);
		const styles =
			new Map<string, NodeStyle>();
		const usedSignatures =
			new Set<string>();
		let accentIndex = 0;

		for (const typeKey of typeKeys) {
			const paletteStyle =
				this.getPaletteNodeStyle(
					typeKey
				);
			const signature =
				this.createNodeStyleSignature(
					paletteStyle
				);

			if (
				this.isKnownEntityType(typeKey) &&
				!usedSignatures.has(signature)
			) {
				styles.set(typeKey, paletteStyle);
				usedSignatures.add(signature);
				continue;
			}

			const customStyle =
				this.createCustomNodeStyle(
					accentIndex,
					usedSignatures
				);

			accentIndex++;
			styles.set(typeKey, customStyle);
			usedSignatures.add(
				this.createNodeStyleSignature(
					customStyle
				)
			);
		}

		return styles;
	}

	getEdgeStyle(
		relation: IRelation
	): EdgeStyle {
		if (this.isBidirectional(relation)) {
			return this.palette.edges
				.bidirectional;
		}

		const baseStyle =
			this.palette.edges[
				this.normalizeRelationType(
					relation.type
				)
			];

		return {
			...baseStyle,
			color:
				this.getRelationColor(
					relation,
					baseStyle.color
				)
		};
	}

	applyNodeStyle(
		data: CanvasNodeData,
		entity: IEntity,
		nodeStyleMap?: ReadonlyMap<string, NodeStyle>
	): CanvasNodeData {
		const style =
			this.getNodeStyle(
				entity,
				nodeStyleMap
			);

		return {
			...data,
			color: style.backgroundColor,
			borderColor: style.borderColor,
			textColor: style.textColor,
			[FLOWCHAIN_STYLE_KEY]: {
				...(this.getExistingStyle(data)),
				node: style,
				theme:
					this.palette.theme
			}
		};
	}

	applyEdgeStyle(
		data: CanvasEdgeData,
		relation: IRelation
	): CanvasEdgeData {
		const style =
			this.getEdgeStyle(relation);

		return {
			...data,
			color: style.color,
			fromEnd: style.fromEnd,
			toEnd: style.toEnd,
			lineStyle: style.lineStyle,
			width: style.width,
			[FLOWCHAIN_STYLE_KEY]: {
				...(this.getExistingStyle(data)),
				edge: style,
				theme:
					this.palette.theme
			}
		};
	}

	private normalizeEntityType(
		type: string
	): keyof StylePalette["nodes"] {
		const normalized =
			this.createTypeKey(type);
		const aliases:
			Partial<Record<string, keyof StylePalette["nodes"]>> = {
				"影响因素": "factor",
				"influencing-factor": "factor",
				"influence-factor": "factor",
				factor: "factor",
				"risk-factor": "factor",
				机制: "mechanism",
				mechanism: "mechanism",
				疾病: "disease",
				"disease-node": "disease",
				disease: "disease",
				症状: "symptom",
				symptom: "symptom",
				symptoms: "symptom",
				药物: "drug",
				drug: "drug",
				medicine: "drug",
				medication: "drug",
				检查: "test",
				test: "test",
				exam: "test",
				examination: "test",
				inspection: "test",
				治疗: "treatment",
				treatment: "treatment",
				therapy: "treatment",
				生活方式: "lifestyle",
				lifestyle: "lifestyle",
				营养: "nutrition",
				nutrition: "nutrition",
				其它: "other",
				其他: "other",
				other: "other"
			};
		const alias =
			aliases[normalized];

		if (alias) {
			return alias;
		}

		switch (normalized) {
			case "影响因素":
			case "factor":
			case "risk-factor":
				return "factor";
			case "机制":
			case "mechanism":
				return "mechanism";
			case "疾病":
			case "disease":
				return "disease";
			case "症状":
			case "symptom":
				return "symptom";
			case "药物":
			case "drug":
			case "medication":
				return "drug";
			case "检查":
			case "test":
			case "exam":
			case "inspection":
				return "test";
			case "治疗":
			case "treatment":
			case "therapy":
				return "treatment";
			case "生活方式":
			case "lifestyle":
				return "lifestyle";
			case "营养":
			case "nutrition":
				return "nutrition";
			case "其它":
			case "其他":
			case "other":
				return "other";
			default:
				return "other";
		}
	}

	private isKnownEntityType(
		typeKey: string
	): boolean {
		return (
			this.normalizeEntityType(typeKey) !==
				"other" ||
			typeKey === "其它" ||
			typeKey === "其他" ||
			typeKey === "other"
		);
	}

	private getPaletteNodeStyle(
		typeKey: string
	): NodeStyle {
		return this.palette.nodes[
			this.normalizeEntityType(typeKey)
		];
	}

	private createTypeKey(
		type: string
	): string {
		return type
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "");
	}

	private createNodeStyleSignature(
		style: NodeStyle
	): string {
		return [
			style.backgroundColor,
			style.borderColor,
			style.textColor
		].join("|");
	}

	private createCustomNodeStyle(
		index: number,
		usedSignatures: ReadonlySet<string>
	): NodeStyle {
		for (
			let offset = 0;
			offset < this.palette.nodeAccents.length;
			offset++
		) {
			const color =
				this.palette.nodeAccents[
					(index + offset) %
						this.palette.nodeAccents.length
				];

			if (!color) {
				continue;
			}

			const style =
				this.createNodeStyleFromColor(
					color
				);
			const signature =
				this.createNodeStyleSignature(
					style
				);

			if (!usedSignatures.has(signature)) {
				return style;
			}
		}

		return this.createGeneratedNodeStyle(
			index
		);
	}

	private createNodeStyleFromColor(
		backgroundColor: string
	): NodeStyle {
		return {
			backgroundColor,
			borderColor:
				this.adjustHexLightness(
					backgroundColor,
					-32
				),
			textColor:
				this.getReadableTextColor(
					backgroundColor
				)
		};
	}

	private createGeneratedNodeStyle(
		index: number
	): NodeStyle {
		const hue =
			(index * 137 + 29) % 360;
		const backgroundColor =
			this.hslToHex(hue, 82, 45);

		return this.createNodeStyleFromColor(
			backgroundColor
		);
	}

	private normalizeRelationType(
		type: string
	): keyof StylePalette["edges"] {
		const normalized =
			type.trim().toLowerCase();

		switch (normalized) {
			case "因果关系":
			case "因果":
			case "cause":
			case "causal":
			case "downstream":
				return "causal";
			case "组成关系":
			case "组成":
			case "part-of":
			case "composition":
				return "composition";
			case "促进":
			case "promotes":
			case "increase":
				return "promotes";
			case "抑制":
			case "inhibits":
			case "decrease":
				return "inhibits";
			case "双向关系":
			case "双向":
			case "bidirectional":
				return "bidirectional";
			case "关联关系":
			case "关联":
			case "related":
			case "association":
			default:
				return "association";
		}
	}

	private isBidirectional(
		relation: IRelation
	): boolean {
		return (
			relation.properties.bidirectional ===
				true ||
			this.normalizeRelationType(
				relation.type
			) === "bidirectional"
		);
	}

	private getRelationColor(
		relation: IRelation,
		fallback: string
	): string {
		const accents =
			this.palette.edgeAccents;

		if (accents.length === 0) {
			return fallback;
		}

		return accents[
			this.hashString(relation.id) %
				accents.length
		] ?? fallback;
	}

	private hashString(value: string): number {
		let hash = 0;

		for (let index = 0; index < value.length; index += 1) {
			hash =
				(hash * 31 +
					value.charCodeAt(index)) >>>
				0;
		}

		return hash;
	}

	private adjustHexLightness(
		hexColor: string,
		amount: number
	): string {
		const { red, green, blue } =
			this.hexToRgb(hexColor);

		return this.rgbToHex(
			this.clampColor(red + amount),
			this.clampColor(green + amount),
			this.clampColor(blue + amount)
		);
	}

	private getReadableTextColor(
		hexColor: string
	): string {
		const { red, green, blue } =
			this.hexToRgb(hexColor);
		const luminance =
			(red * 299 +
				green * 587 +
				blue * 114) /
			1000;

		return luminance > 150
			? "#111827"
			: "#ffffff";
	}

	private hexToRgb(hexColor: string): {
		red: number;
		green: number;
		blue: number;
	} {
		const normalized =
			hexColor.replace("#", "");
		const value =
			Number.parseInt(
				normalized,
				16
			);

		return {
			red: (value >> 16) & 255,
			green: (value >> 8) & 255,
			blue: value & 255
		};
	}

	private hslToHex(
		hue: number,
		saturation: number,
		lightness: number
	): string {
		const normalizedSaturation =
			saturation / 100;
		const normalizedLightness =
			lightness / 100;
		const chroma =
			(1 -
				Math.abs(
					2 * normalizedLightness - 1
				)) *
			normalizedSaturation;
		const huePrime = hue / 60;
		const secondComponent =
			chroma *
			(1 -
				Math.abs(
					(huePrime % 2) - 1
				));
		const match =
			normalizedLightness -
			chroma / 2;
		const [red, green, blue] =
			this.getRgbPrime(
				huePrime,
				chroma,
				secondComponent
			);

		return this.rgbToHex(
			Math.round((red + match) * 255),
			Math.round((green + match) * 255),
			Math.round((blue + match) * 255)
		);
	}

	private getRgbPrime(
		huePrime: number,
		chroma: number,
		secondComponent: number
	): [number, number, number] {
		if (huePrime < 1) {
			return [
				chroma,
				secondComponent,
				0
			];
		}

		if (huePrime < 2) {
			return [
				secondComponent,
				chroma,
				0
			];
		}

		if (huePrime < 3) {
			return [
				0,
				chroma,
				secondComponent
			];
		}

		if (huePrime < 4) {
			return [
				0,
				secondComponent,
				chroma
			];
		}

		if (huePrime < 5) {
			return [
				secondComponent,
				0,
				chroma
			];
		}

		return [
			chroma,
			0,
			secondComponent
		];
	}

	private rgbToHex(
		red: number,
		green: number,
		blue: number
	): string {
		return `#${[
			red,
			green,
			blue
		]
			.map((value) =>
				this.clampColor(value)
					.toString(16)
					.padStart(2, "0")
			)
			.join("")}`;
	}

	private clampColor(value: number): number {
		return Math.max(
			0,
			Math.min(255, value)
		);
	}

	private getExistingStyle(
		data: Record<string, unknown>
	): Record<string, unknown> {
		const existing =
			data[FLOWCHAIN_STYLE_KEY];

		if (
			existing &&
			typeof existing === "object"
		) {
			return existing as Record<
				string,
				unknown
			>;
		}

		return {};
	}
}
