const pluginKey = 'plugin.inlang.messageFormat';

const getLocales = (settings) => settings.locales ?? settings.languageTags ?? [];

const getPathPatterns = (settings) => {
	const pathPattern = settings[pluginKey]?.pathPattern;
	if (Array.isArray(pathPattern)) return pathPattern;
	return pathPattern ? [pathPattern] : [];
};

const messagePath = (pathPattern, locale) =>
	pathPattern.replace(/\{(locale|languageTag)\}/g, locale);

const parseLegacyPattern = (value) => {
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

const parseMessagePattern = (value) => {
	const text = String(value);
	const pattern = [];
	const declarations = [];
	const placeholder = /\{([^}]+)\}/g;
	let cursor = 0;

	for (const match of text.matchAll(placeholder)) {
		if (match.index > cursor) {
			pattern.push({ type: 'text', value: text.slice(cursor, match.index) });
		}

		declarations.push({ type: 'input-variable', name: match[1] });
		pattern.push({
			type: 'expression',
			arg: { type: 'variable-reference', name: match[1] }
		});
		cursor = match.index + match[0].length;
	}

	if (cursor < text.length) {
		pattern.push({ type: 'text', value: text.slice(cursor) });
	}

	return { pattern, declarations };
};

const uniqueDeclarations = (declarations) => {
	const seen = new Set();
	return declarations.filter((declaration) => {
		const key = `${declaration.type}:${declaration.name}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

const toBeImportedFiles = async ({ settings }) => {
	const files = [];

	for (const pathPattern of getPathPatterns(settings)) {
		for (const locale of getLocales(settings)) {
			files.push({
				locale,
				path: messagePath(pathPattern, locale)
			});
		}
	}

	return files;
};

const importFiles = async ({ files }) => {
	const bundleMap = new Map();
	const messages = [];
	const variants = [];

	for (const file of files) {
		const locale = file.locale;
		const json = JSON.parse(new TextDecoder().decode(file.content));

		for (const [bundleId, value] of Object.entries(json)) {
			if (bundleId === '$schema') continue;

			const { pattern, declarations } = parseMessagePattern(value);

			if (bundleMap.has(bundleId)) {
				const bundle = bundleMap.get(bundleId);
				bundle.declarations = uniqueDeclarations([...bundle.declarations, ...declarations]);
			} else {
				bundleMap.set(bundleId, {
					id: bundleId,
					declarations: uniqueDeclarations(declarations)
				});
			}

			messages.push({
				bundleId,
				locale,
				selectors: []
			});

			variants.push({
				messageBundleId: bundleId,
				messageLocale: locale,
				matches: [],
				pattern
			});
		}
	}

	return {
		bundles: [...bundleMap.values()],
		messages,
		variants
	};
};

const loadMessages = async ({ settings, nodeishFs }) => {
	const messages = {};
	const pathPattern = getPathPatterns(settings)[0];

	if (!pathPattern) return [];

	for (const languageTag of getLocales(settings)) {
		try {
			const file = await nodeishFs.readFile(messagePath(pathPattern, languageTag), {
				encoding: 'utf-8'
			});
			const json = JSON.parse(file);

			for (const [id, value] of Object.entries(json)) {
				if (id === '$schema') continue;

				const variant = {
					languageTag,
					match: [],
					pattern: parseLegacyPattern(value)
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

const saveMessages = async () => {};

const exportFiles = async () => [];

export default {
	key: pluginKey,
	id: pluginKey,
	displayName: 'Local Inlang Message Format',
	description: 'Loads flat JSON message files without a remote CDN plugin.',
	loadMessages,
	saveMessages,
	toBeImportedFiles,
	importFiles,
	exportFiles
};
