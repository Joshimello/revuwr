import type {
	ApplicationExportRequest,
	ExportScalar,
	NormalizedApplicationExport,
	NormalizedExportApplication
} from '$lib/export/types';
import PDFDocument from 'pdfkit';
import { getExportLabels } from './labels';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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
		return new Intl.DateTimeFormat(locale === 'zh-tw' ? 'zh-TW' : 'en-US', options).format(
			value
		);
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

function questionBlock(
	document: PDFKit.PDFDocument,
	question: NormalizedApplicationExport['questions'][number],
	application: NormalizedExportApplication,
	requiredLabel: string,
	optionalLabel: string
): void {
	const answer = application.answers[question.id];
	ensureSpace(document, 56);
	document
		.fontSize(9)
		.fillColor('#374151')
		.text(
			`${question.label} (${question.required ? requiredLabel : optionalLabel})`,
			MARGIN,
			document.y,
			{
				width: CONTENT_WIDTH
			}
		);
	document.moveDown(0.35);

	if (answer?.files.length) {
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
			questionBlock(document, question, application, labels.required, labels.optional);
		}
	}

	addFooters(document, data, String(application.application.serial || application.id));
	document.end();
	return completed;
}
