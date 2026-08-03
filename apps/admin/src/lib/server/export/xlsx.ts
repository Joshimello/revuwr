import type {
	ApplicationExportRequest,
	ExportFileLink,
	ExportScalar,
	NormalizedApplicationExport,
	NormalizedExportApplication
} from '$lib/export/types';
import ExcelJS from 'exceljs';
import { getExportLabels } from './labels';

type ColumnValue = ExportScalar | ExportFileLink;

type ExportColumn = {
	key: string;
	label: string;
	width: number;
	date?: boolean;
	value: (application: NormalizedExportApplication) => ColumnValue;
};

type FullExportColumn = ExportColumn & {
	groupKey?: string;
	groupLabel?: string;
	tableQuestionId?: string;
	tableKey?: string;
	value: (application: NormalizedExportApplication, rowIndex?: number) => ColumnValue;
};

function setCellValue(cell: ExcelJS.Cell, column: ExportColumn, value: ColumnValue): void {
	if (value && typeof value === 'object' && 'url' in value) {
		cell.value = {
			text: value.name,
			hyperlink: value.url,
			tooltip: value.url
		};
		cell.font = { color: { argb: 'FF2563EB' }, underline: true };
	} else {
		cell.value = value;
	}

	if (column.date && value instanceof Date) {
		cell.numFmt =
			column.key.endsWith('birthday') || column.key.endsWith('.date')
				? 'yyyy-mm-dd'
				: 'yyyy-mm-dd hh:mm';
	}
	cell.alignment = { vertical: 'top', wrapText: true };
}

function textLength(value: ColumnValue): number {
	if (value instanceof Date) return 19;
	if (value && typeof value === 'object' && 'name' in value) return value.name.length;
	return String(value ?? '')
		.split('\n')
		.reduce((maximum, line) => Math.max(maximum, line.length), 0);
}

function createColumns(
	data: NormalizedApplicationExport,
	fields: ApplicationExportRequest['fields']
): ExportColumn[] {
	const labels = getExportLabels(data.locale);
	const columns: ExportColumn[] = [];

	for (const field of fields.application) {
		columns.push({
			key: `application.${field}`,
			label: labels.applicationFields[field],
			width: 16,
			date: ['created', 'submissionTime', 'updated'].includes(field),
			value: (application) => application.application[field]
		});
	}

	for (const field of fields.applicant) {
		columns.push({
			key: `applicant.${field}`,
			label: labels.applicantFields[field],
			width: 16,
			date: field === 'birthday',
			value: (application) => application.applicant[field]
		});
	}

	for (const question of data.questions) {
		if (question.type === 'member') {
			for (const [tableKey, label] of Object.entries(labels.memberColumns)) {
				columns.push({
					key: `question.${question.id}.${tableKey}`,
					label: `${question.label} - ${label}`,
					width: ['email', 'department'].includes(tableKey) ? 24 : 18,
					value: (application) =>
						(application.answers[question.id]?.tableRows || [])
							.map((row) => String(row[tableKey] ?? ''))
							.join(', ')
				});
			}
			continue;
		}

		if (question.type !== 'file') {
			columns.push({
				key: `question.${question.id}`,
				label: question.label,
				width: 24,
				value: (application) => {
					const answer = application.answers[question.id];
					return question.type === 'budget'
						? (answer?.compactValue ?? answer?.value ?? '')
						: answer?.value || '';
				}
			});
			continue;
		}

		const maximumFiles = Math.max(
			1,
			...data.applications.map((application) => application.answers[question.id]?.files.length || 0)
		);
		for (let index = 0; index < maximumFiles; index += 1) {
			columns.push({
				key: `question.${question.id}.file.${index}`,
				label: `${question.label} - ${labels.file} ${index + 1}`,
				width: 28,
				value: (application) => application.answers[question.id]?.files[index] || ''
			});
		}
	}

	return columns;
}

function createFullColumns(
	data: NormalizedApplicationExport,
	fields: ApplicationExportRequest['fields']
): FullExportColumn[] {
	const labels = getExportLabels(data.locale);
	const columns: FullExportColumn[] = [];

	for (const field of fields.application) {
		columns.push({
			key: `application.${field}`,
			label: labels.applicationFields[field],
			width: 16,
			date: ['created', 'submissionTime', 'updated'].includes(field),
			value: (application) => application.application[field]
		});
	}

	for (const field of fields.applicant) {
		columns.push({
			key: `applicant.${field}`,
			label: labels.applicantFields[field],
			width: 16,
			date: field === 'birthday',
			value: (application) => application.applicant[field]
		});
	}

	for (const question of data.questions) {
		if (question.type === 'member' || question.type === 'activity') {
			const columnLabels =
				question.type === 'member' ? labels.memberColumns : labels.activityColumns;
			for (const [tableKey, label] of Object.entries(columnLabels)) {
				columns.push({
					key: `question.${question.id}.${tableKey}`,
					label,
					width: ['email', 'topic', 'location', 'note'].includes(tableKey) ? 22 : 16,
					date: question.type === 'activity' && tableKey === 'date',
					groupKey: question.id,
					groupLabel: question.label,
					tableQuestionId: question.id,
					tableKey,
					value: (application, rowIndex: number = 0) => {
						const value = application.answers[question.id]?.tableRows?.[rowIndex]?.[tableKey] ?? '';
						if (question.type === 'activity' && tableKey === 'form') {
							return labels.activityForms[String(value)] || value;
						}
						if (question.type === 'activity' && tableKey === 'date' && value) {
							const date = new Date(String(value));
							return Number.isNaN(date.getTime()) ? value : date;
						}
						return value;
					}
				});
			}
			continue;
		}

		if (question.type !== 'file') {
			columns.push({
				key: `question.${question.id}`,
				label: question.label,
				width: 24,
				value: (application) => application.answers[question.id]?.value || ''
			});
			continue;
		}

		const maximumFiles = Math.max(
			1,
			...data.applications.map((application) => application.answers[question.id]?.files.length || 0)
		);
		for (let index = 0; index < maximumFiles; index += 1) {
			columns.push({
				key: `question.${question.id}.file.${index}`,
				label: `${question.label} - ${labels.file} ${index + 1}`,
				width: 28,
				value: (application) => application.answers[question.id]?.files[index] || ''
			});
		}
	}

	return columns;
}

async function generateCompactWorkbook(
	data: NormalizedApplicationExport,
	fields: ApplicationExportRequest['fields']
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Revuwer';
	workbook.created = new Date();
	workbook.modified = new Date();
	workbook.subject = data.eventName;
	workbook.title = `${data.eventName} applications`;

	const labels = getExportLabels(data.locale);
	const worksheet = workbook.addWorksheet(labels.worksheet, {
		views: [{ state: 'frozen', ySplit: 1 }]
	});
	const columns = createColumns(data, fields);

	worksheet.columns = columns.map((column) => ({
		key: column.key,
		header: column.label,
		width: column.width
	}));

	for (const application of data.applications) {
		const row = worksheet.addRow(
			Object.fromEntries(columns.map((column) => [column.key, column.value(application)]))
		);

		let maximumLines = 1;
		columns.forEach((column, index) => {
			const cell = row.getCell(index + 1);
			const value = column.value(application);
			setCellValue(cell, column, value);
			maximumLines = Math.max(maximumLines, String(cell.text || '').split('\n').length);
		});

		row.height = Math.min(90, Math.max(18, maximumLines * 15));
	}

	const header = worksheet.getRow(1);
	header.height = 32;
	header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	header.alignment = { vertical: 'middle', wrapText: true };
	header.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF111827' }
	};

	if (columns.length > 0) {
		worksheet.autoFilter = {
			from: { row: 1, column: 1 },
			to: { row: Math.max(1, worksheet.rowCount), column: columns.length }
		};
	}

	columns.forEach((column, index) => {
		let width = column.label.length + 2;
		for (const application of data.applications) {
			width = Math.max(width, textLength(column.value(application)) + 2);
		}
		worksheet.getColumn(index + 1).width = Math.min(50, Math.max(12, width));
	});

	worksheet.eachRow((row) => {
		row.eachCell((cell) => {
			cell.border = {
				bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
			};
		});
	});

	const output = await workbook.xlsx.writeBuffer();
	return Buffer.from(output);
}

async function generateFullWorkbook(
	data: NormalizedApplicationExport,
	fields: ApplicationExportRequest['fields']
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Revuwer';
	workbook.created = new Date();
	workbook.modified = new Date();
	workbook.subject = data.eventName;
	workbook.title = `${data.eventName} applications`;

	const labels = getExportLabels(data.locale);
	const worksheet = workbook.addWorksheet(labels.worksheet, {
		views: [{ state: 'frozen', ySplit: 2 }]
	});
	const columns = createFullColumns(data, fields);
	const tableQuestionIds = [
		...new Set(
			columns
				.map((column) => column.tableQuestionId)
				.filter((questionId): questionId is string => Boolean(questionId))
		)
	];

	worksheet.columns = columns.map((column) => ({
		key: column.key,
		width: column.width
	}));

	let columnIndex = 0;
	while (columnIndex < columns.length) {
		const column = columns[columnIndex];
		const excelColumn = columnIndex + 1;

		if (!column.groupKey) {
			worksheet.getCell(1, excelColumn).value = column.label;
			worksheet.mergeCells(1, excelColumn, 2, excelColumn);
			columnIndex += 1;
			continue;
		}

		let groupEndIndex = columnIndex;
		while (
			groupEndIndex + 1 < columns.length &&
			columns[groupEndIndex + 1].groupKey === column.groupKey
		) {
			groupEndIndex += 1;
		}
		worksheet.getCell(1, excelColumn).value = column.groupLabel || column.label;
		if (groupEndIndex > columnIndex) {
			worksheet.mergeCells(1, excelColumn, 1, groupEndIndex + 1);
		}
		for (let groupIndex = columnIndex; groupIndex <= groupEndIndex; groupIndex += 1) {
			worksheet.getCell(2, groupIndex + 1).value = columns[groupIndex].label;
		}
		columnIndex = groupEndIndex + 1;
	}

	for (const headerRowNumber of [1, 2]) {
		const header = worksheet.getRow(headerRowNumber);
		header.height = 28;
		for (let index = 1; index <= columns.length; index += 1) {
			const cell = header.getCell(index);
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: headerRowNumber === 1 ? 'FF111827' : 'FF374151' }
			};
			cell.border = {
				right: { style: 'thin', color: { argb: 'FF6B7280' } },
				bottom: { style: 'thin', color: { argb: 'FF6B7280' } }
			};
		}
	}
	columns.forEach((column, index) => {
		if (!column.groupKey) {
			worksheet.getCell(1, index + 1).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FF111827' }
			};
		}
	});

	for (const application of data.applications) {
		const blockHeight = Math.max(
			1,
			...tableQuestionIds.map(
				(questionId) => application.answers[questionId]?.tableRows?.length || 0
			)
		);
		const blockStartRow = worksheet.rowCount + 1;
		let maximumLines = 1;

		for (let rowIndex = 0; rowIndex < blockHeight; rowIndex += 1) {
			const row = worksheet.addRow([]);
			columns.forEach((column, index) => {
				const value = column.tableQuestionId
					? column.value(application, rowIndex)
					: rowIndex === 0
						? column.value(application)
						: '';
				const cell = row.getCell(index + 1);
				setCellValue(cell, column, value);
				if (!column.tableQuestionId && rowIndex === 0) {
					maximumLines = Math.max(maximumLines, String(cell.text || '').split('\n').length);
				}
				cell.border = {
					right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
					bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
				};
			});
		}

		const blockEndRow = blockStartRow + blockHeight - 1;
		if (blockHeight > 1) {
			columns.forEach((column, index) => {
				if (!column.tableQuestionId) {
					worksheet.mergeCells(blockStartRow, index + 1, blockEndRow, index + 1);
					worksheet.getCell(blockStartRow, index + 1).alignment = {
						vertical: 'top',
						wrapText: true
					};
				}
			});
		}

		const desiredBlockHeight = Math.min(90, Math.max(blockHeight * 18, maximumLines * 15));
		const rowHeight = Math.max(18, desiredBlockHeight / blockHeight);
		for (let rowNumber = blockStartRow; rowNumber <= blockEndRow; rowNumber += 1) {
			worksheet.getRow(rowNumber).height = rowHeight;
		}

		for (let index = 1; index <= columns.length; index += 1) {
			const cell = worksheet.getCell(blockEndRow, index);
			cell.border = {
				...cell.border,
				bottom: { style: 'medium', color: { argb: 'FF9CA3AF' } }
			};
		}
	}

	columns.forEach((column, index) => {
		let width = column.label.length + 2;
		for (const application of data.applications) {
			if (column.tableQuestionId) {
				for (const row of application.answers[column.tableQuestionId]?.tableRows || []) {
					const value =
						column.tableKey === 'form'
							? labels.activityForms[String(row[column.tableKey])] || row[column.tableKey]
							: row[column.tableKey || ''];
					width = Math.max(width, textLength(value ?? '') + 2);
				}
			} else {
				width = Math.max(width, textLength(column.value(application)) + 2);
			}
		}
		worksheet.getColumn(index + 1).width = Math.min(40, Math.max(12, width));
	});

	const output = await workbook.xlsx.writeBuffer();
	return Buffer.from(output);
}

export async function generateApplicationWorkbook(
	data: NormalizedApplicationExport,
	fields: ApplicationExportRequest['fields'],
	representation: ApplicationExportRequest['xlsxRepresentation'] = 'compact'
): Promise<Buffer> {
	const hasExpandedTables = data.questions.some(
		(question) => question.type === 'member' || question.type === 'activity'
	);
	if (representation === 'full' && hasExpandedTables) {
		return generateFullWorkbook(data, fields);
	}
	return generateCompactWorkbook(data, fields);
}
