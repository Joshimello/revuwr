export const applicationExportFieldKeys = [
	'eventName',
	'serial',
	'status',
	'created',
	'submissionTime',
	'updated',
	'internalId',
	'adminNote'
] as const;

export const applicantExportFieldKeys = [
	'username',
	'name',
	'nameEn',
	'email',
	'phone',
	'occupation',
	'college',
	'department',
	'year',
	'country',
	'birthday',
	'internalId'
] as const;

export type ApplicationExportField = (typeof applicationExportFieldKeys)[number];
export type ApplicantExportField = (typeof applicantExportFieldKeys)[number];
export type ExportLocale = 'en' | 'zh-tw';
export type ExportFormat = 'xlsx' | 'pdf';
export type XlsxRepresentation = 'compact' | 'full';

export interface ApplicationExportRequest {
	eventId: string;
	applicationIds: string[];
	format: ExportFormat;
	xlsxRepresentation: XlsxRepresentation;
	locale: ExportLocale;
	fields: {
		application: ApplicationExportField[];
		applicant: ApplicantExportField[];
		questionIds: string[];
	};
}

export interface ExportFileLink {
	name: string;
	url: string;
}

export interface NormalizedExportQuestion {
	id: string;
	label: string;
	title: string;
	type: string;
	page: number;
	count: number;
	required: boolean;
}

export interface NormalizedExportAnswer {
	value: string;
	files: ExportFileLink[];
	tableRows?: Record<string, ExportScalar>[];
}

export type ExportScalar = string | number | Date | null;

export interface NormalizedExportApplication {
	id: string;
	filenameBase: string;
	application: Record<ApplicationExportField, ExportScalar>;
	applicant: Record<ApplicantExportField, ExportScalar>;
	answers: Record<string, NormalizedExportAnswer>;
}

export interface NormalizedApplicationExport {
	eventId: string;
	eventName: string;
	locale: ExportLocale;
	questions: NormalizedExportQuestion[];
	applications: NormalizedExportApplication[];
}

export interface ExportPreferences {
	version: 1;
	format: ExportFormat;
	xlsxRepresentation: XlsxRepresentation;
	applicationFields: ApplicationExportField[];
	applicantFields: ApplicantExportField[];
	questionIds: string[];
}
