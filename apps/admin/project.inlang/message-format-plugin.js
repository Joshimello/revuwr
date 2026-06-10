const pluginKey = 'plugin.inlang.messageFormat';

const getLanguageTags = (settings) => settings.languageTags ?? settings.locales ?? [];

const messagePath = (settings, languageTag) =>
	settings[pluginKey].pathPattern.replace(/\{(languageTag|locale)\}/g, languageTag);

const parsePattern = (value) => {
	const text = String(value);
	const pattern = [];
	const placeholder = /\{([^}]+)\}/g;
	let cursor = 0;

	for (const match of text.matchAll(placeholder)) {
		if (match.index > cursor) {
			pattern.push({ type: 'Text', value: text.slice(cursor, match.index) });
		}

		pattern.push({ type: 'VariableReference', name: match[1] });
		cursor = match.index + match[0].length;
	}

	if (cursor < text.length) {
		pattern.push({ type: 'Text', value: text.slice(cursor) });
	}

	return pattern;
};

const serializePattern = (pattern) =>
	pattern
		.map((node) => {
			if (node.type === 'Text') return node.value;
			if (node.type === 'VariableReference') return `{${node.name}}`;
			return '';
		})
		.join('');

const loadMessages = async ({ settings, nodeishFs }) => {
	const messages = {};

	for (const languageTag of getLanguageTags(settings)) {
		try {
			const file = await nodeishFs.readFile(messagePath(settings, languageTag), {
				encoding: 'utf-8'
			});
			const json = JSON.parse(file);

			for (const [id, value] of Object.entries(json)) {
				if (id === '$schema') continue;

				const variant = {
					languageTag,
					match: [],
					pattern: parsePattern(value)
				};

				if (messages[id]) {
					messages[id].variants.push(variant);
				} else {
					messages[id] = {
						id,
						alias: {},
						selectors: [],
						variants: [variant]
					};
				}
			}
		} catch (error) {
			if (error?.code !== 'ENOENT') throw error;
		}
	}

	return Object.values(messages);
};

const saveMessages = async ({ settings, nodeishFs, messages }) => {
	const byLanguageTag = {};

	for (const message of messages) {
		for (const variant of message.variants) {
			byLanguageTag[variant.languageTag] ??= {};
			byLanguageTag[variant.languageTag][message.id] = serializePattern(variant.pattern);
		}
	}

	for (const [languageTag, values] of Object.entries(byLanguageTag)) {
		await nodeishFs.writeFile(
			messagePath(settings, languageTag),
			JSON.stringify(
				{
					$schema: 'https://inlang.com/schema/inlang-message-format',
					...values
				},
				undefined,
				2
			)
		);
	}
};

export default {
	id: pluginKey,
	displayName: 'Local Inlang Message Format',
	description: 'Loads flat JSON message files without a remote CDN plugin.',
	loadMessages,
	saveMessages
};
