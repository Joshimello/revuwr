import {
	applicantExportFieldKeys,
	applicationExportFieldKeys,
	type ApplicationExportRequest
} from '$lib/export/types';
import { z } from 'zod';

export const applicationExportRequestSchema: z.ZodType<ApplicationExportRequest> = z
	.object({
		eventId: z.string().min(1),
		applicationIds: z.array(z.string().min(1)).min(1),
		format: z.enum(['xlsx', 'pdf']),
		xlsxRepresentation: z.enum(['compact', 'full']),
		locale: z.enum(['en', 'zh-tw']),
		fields: z.object({
			application: z.array(z.enum(applicationExportFieldKeys)),
			applicant: z.array(z.enum(applicantExportFieldKeys)),
			questionIds: z.array(z.string().min(1))
		})
	})
	.superRefine((value, context) => {
		if (new Set(value.applicationIds).size !== value.applicationIds.length) {
			context.addIssue({
				code: 'custom',
				path: ['applicationIds'],
				message: 'Application IDs must be unique'
			});
		}

		const selectedFieldCount =
			value.fields.application.length +
			value.fields.applicant.length +
			value.fields.questionIds.length;
		if (selectedFieldCount === 0) {
			context.addIssue({
				code: 'custom',
				path: ['fields'],
				message: 'Select at least one field'
			});
		}
	});
