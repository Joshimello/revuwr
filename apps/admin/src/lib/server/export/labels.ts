import type { ApplicantExportField, ApplicationExportField, ExportLocale } from '$lib/export/types';

type ExportLabels = {
	applicationFields: Record<ApplicationExportField, string>;
	applicantFields: Record<ApplicantExportField, string>;
	statuses: Record<string, string>;
	memberColumns: Record<string, string>;
	activityColumns: Record<string, string>;
	budgetColumns: {
		item: string;
		price: string;
		quantity: string;
		calculated: string;
	};
	activityForms: Record<string, string>;
	worksheet: string;
	application: string;
	applicant: string;
	responses: string;
	section: string;
	question: string;
	required: string;
	optional: string;
	notApplicable: string;
	missingRequired: string;
	notAnswered: string;
	total: string;
	file: string;
	pageOf: (current: number, total: number) => string;
};

const en: ExportLabels = {
	applicationFields: {
		eventName: 'Event',
		serial: 'Application serial',
		status: 'Status',
		created: 'Created',
		submissionTime: 'Submitted at',
		updated: 'Updated',
		internalId: 'Application internal ID',
		adminNote: 'Admin note'
	},
	applicantFields: {
		username: 'Applicant ID',
		name: 'Applicant name',
		nameEn: 'Applicant English name',
		email: 'Applicant email',
		phone: 'Applicant phone',
		occupation: 'Occupation',
		college: 'College',
		department: 'Department',
		year: 'Year',
		country: 'Country',
		birthday: 'Birthday',
		internalId: 'Applicant internal ID'
	},
	statuses: {
		draft: 'Draft',
		submitted: 'Submitted',
		approved: 'Approved',
		resubmitted: 'Resubmitted',
		editsRequested: 'Edits requested',
		followUpRequested: 'Follow-up requested',
		rejected: 'Rejected',
		withdrawn: 'Withdrawn',
		trashed: 'Trashed'
	},
	memberColumns: {
		name: 'Name',
		username: 'Student/staff ID',
		email: 'Email',
		phone: 'Phone',
		department: 'College',
		country: 'Country'
	},
	activityColumns: {
		date: 'Date',
		startTime: 'Start time',
		endTime: 'End time',
		topic: 'Topic',
		form: 'Format',
		location: 'Location',
		note: 'Note'
	},
	budgetColumns: {
		item: 'Item',
		price: 'Price',
		quantity: 'Quantity',
		calculated: 'Calculated'
	},
	activityForms: {
		physical: 'Physical',
		online: 'Online'
	},
	worksheet: 'Applications',
	application: 'Application',
	applicant: 'Applicant',
	responses: 'Responses',
	section: 'Section',
	question: 'Question',
	required: 'Required',
	optional: 'Optional',
	notApplicable: 'Not applicable',
	missingRequired: 'Missing required response',
	notAnswered: 'Not answered',
	total: 'Total',
	file: 'File',
	pageOf: (current, total) => `Page ${current} of ${total}`
};

const zhTw: ExportLabels = {
	applicationFields: {
		eventName: '活動',
		serial: '申請序號',
		status: '狀態',
		created: '建立時間',
		submissionTime: '提交時間',
		updated: '更新時間',
		internalId: '申請內部 ID',
		adminNote: '管理員備註'
	},
	applicantFields: {
		username: '申請者 ID',
		name: '申請者姓名',
		nameEn: '申請者英文姓名',
		email: '申請者電子郵件',
		phone: '申請者電話',
		occupation: '身分',
		college: '學院',
		department: '系所',
		year: '年級',
		country: '國家',
		birthday: '生日',
		internalId: '申請者內部 ID'
	},
	statuses: {
		draft: '草稿',
		submitted: '已提交',
		approved: '已核准',
		resubmitted: '重新提交',
		editsRequested: '請求編輯',
		followUpRequested: '請求跟進',
		rejected: '未通過',
		withdrawn: '已撤回',
		trashed: '已移至垃圾桶'
	},
	memberColumns: {
		name: '姓名',
		username: '學號／員工編號',
		email: '電子郵件',
		phone: '電話',
		department: '學院',
		country: '國家'
	},
	activityColumns: {
		date: '日期',
		startTime: '開始時間',
		endTime: '結束時間',
		topic: '主題',
		form: '形式',
		location: '地點',
		note: '備註'
	},
	budgetColumns: {
		item: '項目',
		price: '單價',
		quantity: '數量',
		calculated: '計算結果'
	},
	activityForms: {
		physical: '實體',
		online: '線上'
	},
	worksheet: '申請',
	application: '申請資訊',
	applicant: '申請者資訊',
	responses: '申請回覆',
	section: '部分',
	question: '問題',
	required: '必填',
	optional: '選填',
	notApplicable: '不適用',
	missingRequired: '缺少必填回覆',
	notAnswered: '未回答',
	total: '總計',
	file: '檔案',
	pageOf: (current, total) => `第 ${current} 頁，共 ${total} 頁`
};

export function getExportLabels(locale: ExportLocale): ExportLabels {
	return locale === 'zh-tw' ? zhTw : en;
}
