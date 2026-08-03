import type {
	ApplicationExportRequest,
	ExportScalar,
	NormalizedApplicationExport,
	NormalizedBudgetRow,
	NormalizedExportApplication
} from '$lib/export/types';
import PDFDocument from 'pdfkit';
import { getExportLabels } from './labels';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BUDGET_TABLE_X = MARGIN + 12;
const BUDGET_TABLE_WIDTH = CONTENT_WIDTH - 12;
const BUDGET_TABLE_HEADER_HEIGHT = 25;
const BUDGET_TABLE_COLUMN_WIDTHS = [BUDGET_TABLE_WIDTH - 70 - 60 - 90, 70, 60, 90];

function formatScalar(
	value: ExportScalar,
	locale: NormalizedApplicationExport['locale'],
	dateOnly = false
): string {
	if (value === null || value === undefined) return '';
	if (value instanceof Date) {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		};
		if (dateOnly) {
			options.timeZone = 'UTC';
		} else {
			options.hour = '2-digit';
			options.minute = '2-digit';
		}
		return new Intl.DateTimeFormat(locale === 'zh-tw' ? 'zh-TW' : 'en-US', options).format(value);
	}
	return String(value);
}

function ensureSpace(document: PDFKit.PDFDocument, height: number): void {
	if (document.y + height > PAGE_HEIGHT - MARGIN - 28) {
		document.addPage();
	}
}

function sectionHeading(document: PDFKit.PDFDocument, label: string): void {
	ensureSpace(document, 42);
	document.moveDown(0.7);
	document
		.fontSize(11)
		.fillColor('#111827')
		.text(label, MARGIN, document.y, { width: CONTENT_WIDTH });
	document
		.moveTo(MARGIN, document.y + 4)
		.lineTo(PAGE_WIDTH - MARGIN, document.y + 4)
		.strokeColor('#D1D5DB')
		.lineWidth(0.5)
		.stroke();
	document.moveDown(0.8);
}

function fieldRow(document: PDFKit.PDFDocument, label: string, value: string): void {
	ensureSpace(document, 36);
	const rowY = document.y;
	document.fontSize(8.5).fillColor('#6B7280').text(label, MARGIN, rowY, {
		width: 150,
		lineBreak: true
	});
	document
		.fontSize(9.5)
		.fillColor('#111827')
		.text(value || '-', MARGIN + 160, rowY, {
			width: CONTENT_WIDTH - 160,
			lineGap: 2
		});
	document.y = Math.max(document.y, rowY + 18);
	document.moveDown(0.35);
}

function formatBudgetNumber(
	value: ExportScalar,
	locale: NormalizedApplicationExport['locale']
): string {
	if (typeof value !== 'number') return String(value ?? '');
	return new Intl.NumberFormat(locale === 'zh-tw' ? 'zh-TW' : 'en-US', {
		maximumFractionDigits: 4
	}).format(value);
}

function drawBudgetTableHeader(
	document: PDFKit.PDFDocument,
	labels: ReturnType<typeof getExportLabels>
): void {
	const headers = [
		labels.budgetColumns.item,
		labels.budgetColumns.price,
		labels.budgetColumns.quantity,
		labels.budgetColumns.calculated
	];
	const rowY = document.y;
	let cellX = BUDGET_TABLE_X;

	for (let index = 0; index < headers.length; index += 1) {
		const width = BUDGET_TABLE_COLUMN_WIDTHS[index];
		document
			.rect(cellX, rowY, width, BUDGET_TABLE_HEADER_HEIGHT)
			.fillAndStroke('#E5E7EB', '#CBD5E1');
		document
			.fontSize(8)
			.fillColor('#374151')
			.text(headers[index], cellX + 6, rowY + 8, {
				width: width - 12,
				align: index === 0 ? 'left' : 'right',
				lineBreak: false
			});
		cellX += width;
	}
	document.y = rowY + BUDGET_TABLE_HEADER_HEIGHT;
}

function ensureBudgetTableSpace(
	document: PDFKit.PDFDocument,
	height: number,
	labels: ReturnType<typeof getExportLabels>
): void {
	if (document.y + height <= PAGE_HEIGHT - MARGIN - 28) return;
	document.addPage();
	drawBudgetTableHeader(document, labels);
}

function drawBudgetTable(
	document: PDFKit.PDFDocument,
	rows: NormalizedBudgetRow[],
	total: ExportScalar | undefined,
	labels: ReturnType<typeof getExportLabels>,
	locale: NormalizedApplicationExport['locale']
): void {
	ensureSpace(document, BUDGET_TABLE_HEADER_HEIGHT + 28);
	drawBudgetTableHeader(document, labels);

	rows.forEach((row, rowIndex) => {
		document.fontSize(8.3);
		const itemLabel = `${rowIndex + 1}. ${row.name}`;
		const itemWidth = BUDGET_TABLE_COLUMN_WIDTHS[0] - 12;
		const nameHeight = document.heightOfString(itemLabel, { width: itemWidth, lineGap: 1 });
		document.fontSize(7.3);
		const explanationHeight = row.explanation
			? document.heightOfString(row.explanation, { width: itemWidth, lineGap: 1 }) + 3
			: 0;
		const rowHeight = Math.max(28, nameHeight + explanationHeight + 12);
		ensureBudgetTableSpace(document, rowHeight, labels);

		const rowY = document.y;
		const values = [
			itemLabel,
			formatBudgetNumber(row.price, locale),
			formatBudgetNumber(row.quantity, locale),
			formatBudgetNumber(row.calculated, locale)
		];
		let cellX = BUDGET_TABLE_X;

		for (let index = 0; index < values.length; index += 1) {
			const width = BUDGET_TABLE_COLUMN_WIDTHS[index];
			document
				.rect(cellX, rowY, width, rowHeight)
				.fillAndStroke(rowIndex % 2 === 0 ? '#FFFFFF' : '#F9FAFB', '#E5E7EB');
			document
				.fontSize(index === 0 ? 8.3 : 8)
				.fillColor('#111827')
				.text(values[index], cellX + 6, rowY + 7, {
					width: width - 12,
					align: index === 0 ? 'left' : 'right',
					lineGap: 1
				});
			if (index === 0 && row.explanation) {
				document
					.fontSize(7.3)
					.fillColor('#6B7280')
					.text(row.explanation, cellX + 6, rowY + 7 + nameHeight + 3, {
						width: width - 12,
						lineGap: 1
					});
			}
			cellX += width;
		}
		document.y = rowY + rowHeight;
	});

	ensureBudgetTableSpace(document, 29, labels);
	const totalY = document.y;
	const labelWidth = BUDGET_TABLE_COLUMN_WIDTHS.slice(0, 3).reduce((sum, width) => sum + width, 0);
	document.rect(BUDGET_TABLE_X, totalY, labelWidth, 29).fillAndStroke('#F3F4F6', '#CBD5E1');
	document
		.fontSize(8.5)
		.fillColor('#111827')
		.text(labels.total, BUDGET_TABLE_X + 6, totalY + 9, {
			width: labelWidth - 12,
			align: 'right',
			lineBreak: false
		});
	const totalX = BUDGET_TABLE_X + labelWidth;
	const totalWidth = BUDGET_TABLE_COLUMN_WIDTHS[3];
	document.rect(totalX, totalY, totalWidth, 29).fillAndStroke('#DBEAFE', '#93C5FD');
	document
		.fontSize(9)
		.fillColor('#1E3A8A')
		.text(
			total === null || total === undefined ? '-' : formatBudgetNumber(total, locale),
			totalX + 6,
			totalY + 9,
			{
				width: totalWidth - 12,
				align: 'right',
				lineBreak: false
			}
		);
	document.y = totalY + 37;
}

function questionBlock(
	document: PDFKit.PDFDocument,
	question: NormalizedApplicationExport['questions'][number],
	application: NormalizedExportApplication,
	labels: ReturnType<typeof getExportLabels>,
	locale: NormalizedApplicationExport['locale']
): void {
	const answer = application.answers[question.id];
	ensureSpace(document, 56);
	document
		.fontSize(9)
		.fillColor('#374151')
		.text(
			`${question.label} (${question.required ? labels.required : labels.optional})`,
			MARGIN,
			document.y,
			{
				width: CONTENT_WIDTH
			}
		);
	document.moveDown(0.35);

	if (question.type === 'budget' && answer?.budgetRows?.length) {
		drawBudgetTable(document, answer.budgetRows, answer.compactValue, labels, locale);
	} else if (answer?.files.length) {
		for (const file of answer.files) {
			ensureSpace(document, 22);
			document
				.fontSize(9.5)
				.fillColor('#2563EB')
				.text(file.name, MARGIN + 12, document.y, {
					width: CONTENT_WIDTH - 12,
					link: file.url,
					underline: true
				});
		}
	} else {
		document
			.fontSize(9.5)
			.fillColor('#111827')
			.text(answer?.value || '-', MARGIN + 12, document.y, {
				width: CONTENT_WIDTH - 12,
				lineGap: 2
			});
	}
	document.moveDown(0.75);
}

function addFooters(
	document: PDFKit.PDFDocument,
	data: NormalizedApplicationExport,
	serial: string
): void {
	const labels = getExportLabels(data.locale);
	const range = document.bufferedPageRange();

	for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
		document.switchToPage(pageIndex);
		const footerY = PAGE_HEIGHT - 30;
		const bottomMargin = document.page.margins.bottom;
		document.page.margins.bottom = 0;
		document
			.moveTo(MARGIN, footerY - 6)
			.lineTo(PAGE_WIDTH - MARGIN, footerY - 6)
			.strokeColor('#E5E7EB')
			.lineWidth(0.5)
			.stroke();
		document
			.fontSize(7.5)
			.fillColor('#6B7280')
			.text(serial, MARGIN, footerY, { width: CONTENT_WIDTH / 2, lineBreak: false })
			.text(labels.pageOf(pageIndex - range.start + 1, range.count), PAGE_WIDTH / 2, footerY, {
				width: CONTENT_WIDTH / 2,
				align: 'right',
				lineBreak: false
			});
		document.page.margins.bottom = bottomMargin;
	}
}

export async function generateApplicationPdf(
	data: NormalizedApplicationExport,
	application: NormalizedExportApplication,
	fields: ApplicationExportRequest['fields'],
	font: Buffer
): Promise<Buffer> {
	const labels = getExportLabels(data.locale);
	const document = new PDFDocument({
		autoFirstPage: true,
		bufferPages: true,
		margins: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
		size: 'A4',
		info: {
			Title: `${data.eventName} - ${String(application.application.serial)}`,
			Author: 'Revuwer',
			Subject: data.eventName
		}
	});
	const chunks: Buffer[] = [];
	document.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
	const completed = new Promise<Buffer>((resolve, reject) => {
		document.on('end', () => resolve(Buffer.concat(chunks)));
		document.on('error', reject);
	});

	document.registerFont('Noto', font);
	document.font('Noto');
	document
		.fontSize(16)
		.fillColor('#111827')
		.text(data.eventName, MARGIN, MARGIN, { width: CONTENT_WIDTH });
	document.moveDown(0.25);
	document
		.fontSize(10)
		.fillColor('#4B5563')
		.text(String(application.application.serial || application.id), {
			width: CONTENT_WIDTH
		});

	if (fields.application.length > 0) {
		sectionHeading(document, labels.application);
		for (const field of fields.application) {
			fieldRow(
				document,
				labels.applicationFields[field],
				formatScalar(application.application[field], data.locale)
			);
		}
	}

	if (fields.applicant.length > 0) {
		sectionHeading(document, labels.applicant);
		for (const field of fields.applicant) {
			fieldRow(
				document,
				labels.applicantFields[field],
				formatScalar(application.applicant[field], data.locale, field === 'birthday')
			);
		}
	}

	if (data.questions.length > 0) {
		sectionHeading(document, labels.responses);
		let currentPage: number | undefined;
		for (const question of data.questions) {
			if (question.page !== currentPage) {
				ensureSpace(document, 34);
				document
					.fontSize(9.5)
					.fillColor('#6B7280')
					.text(`${labels.section} ${question.page}`, MARGIN, document.y, {
						width: CONTENT_WIDTH
					});
				document.moveDown(0.55);
				currentPage = question.page;
			}
			questionBlock(document, question, application, labels, data.locale);
		}
	}

	addFooters(document, data, String(application.application.serial || application.id));
	document.end();
	return completed;
}
