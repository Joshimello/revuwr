import type { ApplicationExportRequest, NormalizedApplicationExport } from '$lib/export/types';
import { readFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { generateApplicationPdf } from './pdf';
import { calculateBudgetValues } from '../../response-repr';
import {
	normalizeApplicationExport,
	type ExportApplication,
	type ExportQuestion
} from './normalize';
import { applicationExportRequestSchema } from './schema';
import { generateApplicationWorkbook } from './xlsx';

const fields: ApplicationExportRequest['fields'] = {
	application: ['serial', 'status'],
	applicant: ['name', 'birthday'],
	questionIds: ['question-text', 'question-file']
};

const data: NormalizedApplicationExport = {
	eventId: 'event-1',
	eventName: 'Example Event 範例活動',
	locale: 'en',
	questions: [
		{
			id: 'question-text',
			label: 'Question 1 - Motivation',
			title: 'Motivation',
			type: 'text',
			page: 1,
			count: 1,
			required: true
		},
		{
			id: 'question-file',
			label: 'Question 2 - Portfolio',
			title: 'Portfolio',
			type: 'file',
			page: 1,
			count: 2,
			required: false
		}
	],
	applications: [
		{
			id: 'application-1',
			filenameBase: 'APP001 - 王小明',
			application: {
				eventName: 'Example Event 範例活動',
				serial: 'APP001',
				status: 'Submitted',
				created: new Date('2026-01-01T01:00:00.000Z'),
				submissionTime: new Date('2026-01-02T02:00:00.000Z'),
				updated: new Date('2026-01-03T03:00:00.000Z'),
				internalId: 'application-1',
				adminNote: ''
			},
			applicant: {
				username: 'A0001',
				name: '王小明',
				nameEn: 'Xiao-Ming Wang',
				email: 'applicant@example.com',
				phone: '+60 12-345 6789',
				occupation: 'Student',
				college: 'Engineering',
				department: 'Computer Science',
				year: '2',
				country: 'Malaysia',
				birthday: new Date('2000-05-06T00:00:00.000Z'),
				internalId: 'user-1'
			},
			answers: {
				'question-text': {
					value: 'A multilingual answer with 中文內容.',
					files: []
				},
				'question-file': {
					value: 'portfolio.pdf',
					files: [
						{
							name: 'portfolio.pdf',
							url: 'https://files.example.com/portfolio.pdf'
						}
					]
				}
			}
		}
	]
};

describe('application exports', () => {
	it('validates a complete request and rejects an empty field selection', () => {
		const request = {
			eventId: data.eventId,
			applicationIds: ['application-1'],
			format: 'xlsx',
			xlsxRepresentation: 'compact',
			locale: 'en',
			fields
		};

		expect(applicationExportRequestSchema.parse(request)).toEqual(request);
		expect(() =>
			applicationExportRequestSchema.parse({
				...request,
				fields: { application: [], applicant: [], questionIds: [] }
			})
		).toThrow('Select at least one field');
	});

	it('calculates default, custom, range, and rounded budget results', () => {
		const calculation = calculateBudgetValues([
			{
				calculationMethod: 'default',
				defaultPrice: 100,
				defaultQuantity: 2
			},
			{
				calculationMethod: 'custom',
				defaultPrice: 0,
				defaultQuantity: 0,
				customFormula: '{1T} / 3',
				roundingMethod: 'round',
				roundingDecimalPlaces: 2
			},
			{
				calculationMethod: 'range',
				defaultPrice: 0,
				defaultQuantity: 0,
				customFormula: '{1Q}',
				rangeTable: { input: [0, 2], output: [10, 50] }
			}
		]);

		expect(calculation.items).toEqual([200, 66.67, 50]);
		expect(calculation.total).toBe(316.67);
	});

	it('normalizes calculated budget rows and the grand total', () => {
		const question = {
			id: 'question-budget',
			title: 'Budget',
			type: 'budget',
			page: 1,
			count: 1,
			required: true
		} as unknown as ExportQuestion;
		const response = [
			{
				name: 'Materials',
				calculationMethod: 'default',
				defaultPrice: 100,
				defaultQuantity: 3,
				explaination: 'Workshop materials'
			},
			{
				name: 'Administration',
				calculationMethod: 'custom',
				defaultPrice: 0,
				defaultQuantity: 0,
				customFormula: '{1T} * 0.05'
			}
		];
		const application = {
			id: 'application-1',
			serial: 1,
			status: 'submitted',
			created: '2026-01-01T00:00:00.000Z',
			submissionTime: '2026-01-02T00:00:00.000Z',
			updated: '2026-01-03T00:00:00.000Z',
			adminNote: '',
			expand: {
				responder: {
					id: 'user-1',
					name: 'Applicant',
					username: 'A001'
				},
				response: [
					{
						id: 'answer-1',
						question: question.id,
						response,
						expand: { question }
					}
				]
			}
		} as unknown as ExportApplication;
		const normalized = normalizeApplicationExport(
			{
				eventId: 'event-1',
				applicationIds: [application.id],
				format: 'xlsx',
				xlsxRepresentation: 'compact',
				locale: 'en',
				fields: { application: [], applicant: [], questionIds: [question.id] }
			},
			{
				id: 'event-1',
				name: 'Example Event',
				responsePrefix: 'APP'
			} as unknown as Parameters<typeof normalizeApplicationExport>[1],
			[question],
			[application]
		);
		const answer = normalized.applications[0].answers[question.id];

		expect(answer.compactValue).toBe(315);
		expect(answer.budgetRows).toEqual([
			{
				name: 'Materials',
				price: 100,
				quantity: 3,
				calculated: 300,
				explanation: 'Workshop materials'
			},
			{
				name: 'Administration',
				price: 0,
				quantity: 0,
				calculated: 15,
				explanation: ''
			}
		]);
		expect(answer.value).toContain('100 x 3 = 300');
		expect(answer.value).toContain('Total: 315');
	});

	it('creates one worksheet with typed dates and file hyperlinks', async () => {
		const output = await generateApplicationWorkbook(data, fields);
		const workbook = new ExcelJS.Workbook();
		const arrayBuffer = output.buffer.slice(
			output.byteOffset,
			output.byteOffset + output.byteLength
		) as ArrayBuffer;
		await workbook.xlsx.load(arrayBuffer);

		expect(workbook.worksheets).toHaveLength(1);
		const worksheet = workbook.getWorksheet('Applications');
		expect(worksheet).toBeDefined();
		expect(worksheet!.getCell('A1').value).toBe('Application serial');
		expect(worksheet!.getCell('A2').value).toBe('APP001');
		expect(worksheet!.getCell('D2').value).toBeInstanceOf(Date);
		expect(worksheet!.getCell('D2').numFmt).toBe('yyyy-mm-dd');
		expect(worksheet!.getCell('F2').value).toMatchObject({
			text: 'portfolio.pdf',
			hyperlink: 'https://files.example.com/portfolio.pdf'
		});
	});

	it('splits compact member responses into columns with comma-separated members', async () => {
		const compactData: NormalizedApplicationExport = {
			...data,
			questions: [
				...data.questions,
				{
					id: 'question-members',
					label: 'Question 3 - Team members',
					title: 'Team members',
					type: 'member',
					page: 1,
					count: 3,
					required: true
				},
				{
					id: 'question-budget',
					label: 'Question 4 - Budget',
					title: 'Budget',
					type: 'budget',
					page: 1,
					count: 4,
					required: true
				}
			],
			applications: [
				{
					...data.applications[0],
					answers: {
						...data.applications[0].answers,
						'question-members': {
							value: 'Two members',
							files: [],
							tableRows: [
								{
									name: 'Member One',
									username: 'M001',
									email: 'one@example.com',
									phone: '111',
									department: 'Engineering',
									country: 'Malaysia'
								},
								{
									name: 'Member Two',
									username: 'M002',
									email: 'two@example.com',
									phone: '222',
									department: 'Science',
									country: 'Taiwan'
								}
							]
						},
						'question-budget': {
							value: '1. Materials | 100 x 3 = 300\nTotal: 300',
							compactValue: 300,
							files: [],
							budgetRows: [
								{
									name: 'Materials',
									price: 100,
									quantity: 3,
									calculated: 300,
									explanation: 'Workshop materials'
								}
							]
						}
					}
				}
			]
		};
		const output = await generateApplicationWorkbook(compactData, fields, 'compact');
		const workbook = new ExcelJS.Workbook();
		const arrayBuffer = output.buffer.slice(
			output.byteOffset,
			output.byteOffset + output.byteLength
		) as ArrayBuffer;
		await workbook.xlsx.load(arrayBuffer);

		const worksheet = workbook.getWorksheet('Applications')!;
		expect(worksheet.getCell('G1').value).toBe('Question 3 - Team members - Name');
		expect(worksheet.getCell('G2').value).toBe('Member One, Member Two');
		expect(worksheet.getCell('H2').value).toBe('M001, M002');
		expect(worksheet.getCell('I2').value).toBe('one@example.com, two@example.com');
		expect(worksheet.getCell('J2').value).toBe('111, 222');
		expect(worksheet.getCell('K2').value).toBe('Engineering, Science');
		expect(worksheet.getCell('L2').value).toBe('Malaysia, Taiwan');
		expect(worksheet.getCell('M1').value).toBe('Question 4 - Budget');
		expect(worksheet.getCell('M2').value).toBe(300);
		expect(worksheet.getCell('M2').numFmt).toBe('#,##0.####');
	});

	it('expands member rows and merges scalar cells in the full Excel layout', async () => {
		const fullData: NormalizedApplicationExport = {
			...data,
			questions: [
				...data.questions,
				{
					id: 'question-members',
					label: 'Question 3 - Team members',
					title: 'Team members',
					type: 'member',
					page: 1,
					count: 3,
					required: true
				},
				{
					id: 'question-activities',
					label: 'Question 4 - Activities',
					title: 'Activities',
					type: 'activity',
					page: 1,
					count: 4,
					required: true
				},
				{
					id: 'question-budget',
					label: 'Question 5 - Budget',
					title: 'Budget',
					type: 'budget',
					page: 1,
					count: 5,
					required: true
				}
			],
			applications: [
				{
					...data.applications[0],
					answers: {
						...data.applications[0].answers,
						'question-members': {
							value: 'Two members',
							files: [],
							tableRows: [
								{
									name: 'Member One',
									username: 'M001',
									email: 'one@example.com',
									phone: '111',
									department: 'Engineering',
									country: 'Malaysia'
								},
								{
									name: 'Member Two',
									username: 'M002',
									email: 'two@example.com',
									phone: '222',
									department: 'Science',
									country: 'Taiwan'
								}
							]
						},
						'question-activities': {
							value: 'Two activities',
							files: [],
							tableRows: [
								{
									date: '2026-08-01',
									startTime: '09:00',
									endTime: '10:00',
									topic: 'Opening',
									form: 'physical',
									location: 'Hall A',
									note: ''
								},
								{
									date: '2026-08-02',
									startTime: '11:00',
									endTime: '12:00',
									topic: 'Workshop',
									form: 'online',
									location: 'Video call',
									note: 'Hands-on'
								}
							]
						},
						'question-budget': {
							value: '1. Materials | 100 x 3 = 300\nTotal: 300',
							compactValue: 300,
							files: [],
							budgetRows: [
								{
									name: 'Materials',
									price: 100,
									quantity: 3,
									calculated: 300,
									explanation: 'Workshop materials'
								}
							]
						}
					}
				}
			]
		};
		const output = await generateApplicationWorkbook(fullData, fields, 'full');
		const workbook = new ExcelJS.Workbook();
		const arrayBuffer = output.buffer.slice(
			output.byteOffset,
			output.byteOffset + output.byteLength
		) as ArrayBuffer;
		await workbook.xlsx.load(arrayBuffer);

		const worksheet = workbook.getWorksheet('Applications')!;
		expect(worksheet.getCell('A1').value).toBe('Application serial');
		expect(worksheet.getCell('A2').master.address).toBe('A1');
		expect(worksheet.getCell('G1').value).toBe('Question 3 - Team members');
		expect(worksheet.getCell('G2').value).toBe('Name');
		expect(worksheet.getCell('A4').master.address).toBe('A3');
		expect(worksheet.getCell('G3').value).toBe('Member One');
		expect(worksheet.getCell('G4').value).toBe('Member Two');
		expect(worksheet.getCell('M1').value).toBe('Question 4 - Activities');
		expect(worksheet.getCell('M3').value).toBeInstanceOf(Date);
		expect(worksheet.getCell('M3').numFmt).toBe('yyyy-mm-dd');
		expect(worksheet.getCell('Q4').value).toBe('Online');
		expect(worksheet.getCell('T3').value).toContain('100 x 3 = 300');
		expect(worksheet.getCell('T4').master.address).toBe('T3');
		expect(worksheet.autoFilter).toBeUndefined();
	});

	it('creates a readable PDF with the bundled multilingual font', async () => {
		const font = await readFile(new URL('./assets/NotoSansCJKtc-Regular.otf', import.meta.url));
		const pdfData: NormalizedApplicationExport = {
			...data,
			questions: [
				...data.questions,
				{
					id: 'question-members',
					label: 'Question 3 - Team members',
					title: 'Team members',
					type: 'member',
					page: 1,
					count: 3,
					required: true
				},
				{
					id: 'question-activities',
					label: 'Question 4 - Activities',
					title: 'Activities',
					type: 'activity',
					page: 1,
					count: 4,
					required: true
				},
				{
					id: 'question-budget',
					label: 'Question 5 - Budget',
					title: 'Budget',
					type: 'budget',
					page: 1,
					count: 5,
					required: true
				}
			],
			applications: [
				{
					...data.applications[0],
					answers: {
						...data.applications[0].answers,
						'question-members': {
							value: 'Two members',
							files: [],
							tableRows: [
								{
									name: 'Member One',
									username: 'M001',
									email: 'one@example.com',
									phone: '111',
									department: 'Engineering',
									country: 'Malaysia'
								},
								{
									name: 'Member Two',
									username: 'M002',
									email: 'two@example.com',
									phone: '222',
									department: 'Science',
									country: 'Taiwan'
								}
							]
						},
						'question-activities': {
							value: 'Two activities',
							files: [],
							tableRows: [
								{
									date: '2026-08-01',
									startTime: '09:00',
									endTime: '10:00',
									topic: 'Opening',
									form: 'physical',
									location: 'Hall A',
									note: ''
								},
								{
									date: '2026-08-02',
									startTime: '11:00',
									endTime: '12:00',
									topic: 'Workshop',
									form: 'online',
									location: 'Video call',
									note: 'Hands-on'
								}
							]
						},
						'question-budget': {
							value: '1. Materials | 100 x 3 = 300\nTotal: 300',
							compactValue: 300,
							files: [],
							budgetRows: [
								{
									name: 'Materials',
									price: 100,
									quantity: 3,
									calculated: 300,
									explanation: 'Workshop materials'
								},
								{
									name: 'Venue',
									price: 250,
									quantity: 1,
									calculated: 250,
									explanation: ''
								}
							]
						}
					}
				}
			]
		};
		const output = await generateApplicationPdf(pdfData, pdfData.applications[0], fields, font);

		expect(output.subarray(0, 5).toString()).toBe('%PDF-');
		expect(output.length).toBeGreaterThan(10_000);
		expect(output.toString('latin1').match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(0);
	});
});
