import { Entity } from "../entity/Entity";
import {
	DEFAULT_ENTITY_TYPE,
	type EntityType
} from "../entity/EntityType";
import { Relation } from "../relation/Relation";
import type { PropertyValue } from "../types/PropertyValue";
import type { IParser } from "./IParser";
import type { MarkdownDocument } from "./MarkdownDocument";
import type { ParsedGraphData } from "./ParsedGraphData";

type RelationSection =
	| "downstream"
	| "bidirectional";

const DOWNSTREAM_HEADINGS =
	new Set([
		"## 下游关系",
		"## downstream relations",
		"## downstream relation",
		"## downstream",
		"## outgoing relations",
		"## outgoing relation",
		"## outgoing",
		"## relations",
		"## related to",
		"## 涓嬫父鍏崇郴",
		"## 娑撳鐖堕崗宕囬兇"
	]);

const BIDIRECTIONAL_HEADINGS =
	new Set([
		"## 双向关系",
		"## bidirectional relations",
		"## bidirectional relation",
		"## bidirectional",
		"## mutual relations",
		"## mutual relation",
		"## mutual",
		"## two-way relations",
		"## two-way relation",
		"## 鍙屽悜鍏崇郴",
		"## 閸欏苯鎮滈崗宕囬兇"
	]);

export class MarkdownParser implements IParser {
	parse(document: MarkdownDocument): ParsedGraphData {
		const entityId =
			this.createEntityId(document.path);
		const title =
			this.parseTitle(document.content) ??
			this.createTitleFromPath(document.path);
		const entityType =
			this.parseEntityType(document.content);
		const description =
			this.parseDescription(document.content);
		const properties:
			Record<string, PropertyValue> = {
				sourcePath: document.path
			};

		if (description) {
			properties.description = description;
		}

		const entity =
			new Entity(
				entityId,
				entityType,
				title,
				properties
			);
		const relations: Relation[] = [];
		const lines =
			document.content.split(/\r?\n/);
		let section:
			RelationSection | null = null;

		for (const line of lines) {
			const trimmedLine = line.trim();

			if (
				this.isDownstreamHeading(
					trimmedLine
				)
			) {
				section = "downstream";
				continue;
			}

			if (
				this.isBidirectionalHeading(
					trimmedLine
				)
			) {
				section = "bidirectional";
				continue;
			}

			if (
				trimmedLine.startsWith("## ") ||
				this.isDescriptionLine(
					trimmedLine
				)
			) {
				section = null;
				continue;
			}

			if (!section) {
				continue;
			}

			const target =
				this.parseRelationTarget(line);

			if (!target) {
				continue;
			}

			const targetId =
				this.createEntityId(target);

			relations.push(
				section === "downstream"
					? this.createDownstreamRelation(
						entityId,
						targetId
					)
					: this.createBidirectionalRelation(
						entityId,
						targetId
					)
			);
		}

		return {
			entities: [entity],
			relations
		};
	}

	private parseTitle(
		content: string
	): string | undefined {
		const match =
			content.match(/^#\s+(.+)$/m);

		return match?.[1]?.trim();
	}

	private parseEntityType(
		content: string
	): EntityType {
		const match =
			content.match(
				/^(?:类型|type|entity type|node type|绫诲瀷|缁鐎?)[：:锛?閿?]\s*(.+)$/im
			);
		const sourceType =
			match?.[1]?.trim();

		return sourceType || DEFAULT_ENTITY_TYPE;
	}

	private parseDescription(
		content: string
	): string | undefined {
		const lines =
			content.split(/\r?\n/);
		const descriptionLineIndex =
			lines.findIndex((line) =>
				this.isDescriptionLine(
					line.trim()
				)
			);

		if (descriptionLineIndex === -1) {
			return undefined;
		}

		const firstLine =
			lines[descriptionLineIndex];

		if (firstLine === undefined) {
			return undefined;
		}

		const inlineDescription =
			firstLine
				.replace(
					/^.*?(?:描述|description|desc|notes|note|鎻忚堪|閹诲繗鍫?)[：:锛?閿?]/i,
					""
				)
				.trim();
		const followingDescription =
			lines
				.slice(descriptionLineIndex + 1)
				.join("\n")
				.trim();
		const description = [
			inlineDescription,
			followingDescription
		]
			.filter((part) =>
				part.length > 0
			)
			.join("\n");

		return description || undefined;
	}

	private isDescriptionLine(
		line: string
	): boolean {
		return /^(?:描述|description|desc|notes|note|鎻忚堪|閹诲繗鍫?)[：:锛?閿?]/i.test(
			line
		);
	}

	private isDownstreamHeading(
		line: string
	): boolean {
		return DOWNSTREAM_HEADINGS.has(
			this.normalizeHeading(line)
		);
	}

	private isBidirectionalHeading(
		line: string
	): boolean {
		return BIDIRECTIONAL_HEADINGS.has(
			this.normalizeHeading(line)
		);
	}

	private normalizeHeading(
		line: string
	): string {
		return line
			.replace(/\s+/g, " ")
			.trim()
			.toLowerCase();
	}

	private parseRelationTarget(
		line: string
	): string | null {
		const match =
			line.match(
				/^\s*-\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*$/
			);
		const target =
			match?.[1]?.trim();

		return target || null;
	}

	private createDownstreamRelation(
		from: string,
		to: string
	): Relation {
		return new Relation(
			`${from}--${to}--downstream`,
			from,
			to,
			"downstream"
		);
	}

	private createBidirectionalRelation(
		firstId: string,
		secondId: string
	): Relation {
		const [from, to] =
			[firstId, secondId].sort();

		if (!from || !to) {
			throw new Error(
				"Bidirectional relation requires two entity ids."
			);
		}

		return new Relation(
			`${from}--${to}--bidirectional`,
			from,
			to,
			"bidirectional",
			{
				bidirectional: true
			}
		);
	}

	private createEntityId(
		path: string
	): string {
		const normalizedPath =
			path
				.replace(/\\/g, "/")
				.replace(/\.md$/i, "")
				.trim();

		return (
			normalizedPath.split("/").pop() ??
			normalizedPath
		);
	}

	private createTitleFromPath(
		path: string
	): string {
		const normalizedPath =
			path.replace(/\\/g, "/");
		const fileName =
			normalizedPath.split("/").pop() ??
			normalizedPath;

		return fileName.replace(/\.md$/i, "");
	}
}
