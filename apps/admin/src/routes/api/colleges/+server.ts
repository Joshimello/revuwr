import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as cheerio from 'cheerio';

export const GET: RequestHandler = async () => {
	try {
		const url = 'https://curricul.site.nthu.edu.tw/p/406-1208-189767,r8507.php?Lang=zh-tw';
		const response = await fetch(url);
		const text = await response.text();

		const $ = cheerio.load(text);
		const tables = $('table');
		const colleges = new Set<string>();
		const collegeList: { en: string; zh: string }[] = [];

		tables.each((_, table) => {
			const rows = $(table).find('tr');
			rows.each((index, row) => {
				if (index === 0) return; // Skip header row
				const cells = $(row).find('td');
				if (cells.length >= 5) {
					const zh_tw = $(cells[3]).text().trim() || '';
					const en = $(cells[4]).text().trim() || '';
					if (zh_tw && en && en !== 'Units to be Phased out' && zh_tw !== '無') {
						const collegeTuple = `${en}|${zh_tw}`;
						if (!colleges.has(collegeTuple)) {
							colleges.add(collegeTuple);
							collegeList.push({ en, zh: zh_tw });
						}
					}
				}
			});
		});

		collegeList.sort((a, b) => a.en.localeCompare(b.en));

		return json(collegeList);
	} catch (err) {
		throw error(500, 'Failed to fetch colleges');
	}
};
