import { getResponseRepresentation } from '$lib/response-repr';

type ExpandedApplication = {
	id: string;
	serial?: number;
	expand?: {
		event?: {
			name?: string;
			responsePrefix?: string;
		};
		responder?: {
			name?: string;
			email?: string;
		};
		response?: Array<{
			expand?: {
				question?: {
					title?: string;
					page?: number;
				};
			};
		}>;
	};
};

/**
 * Generate HTML email content for application submission confirmation
 */
export function generateApplicationSummaryEmail(application: ExpandedApplication): string {
	const eventName = application.expand?.event?.name || 'Unknown Event';
	const responderName = application.expand?.responder?.name || 'User';
	const serialId = application.serial
		? `${application.expand?.event?.responsePrefix || ''}${application.serial.toString().padStart(3, '0')}`
		: application.id;

	// Strip HTML tags from question titles
	const stripHtml = (html: string): string => {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, '').trim();
	};

	// Group responses by page and sort
	const responsesByPage = new Map<number, Array<unknown>>();

	application.expand?.response?.forEach((resp) => {
		if (resp.expand?.question) {
			const page = resp.expand.question.page || 0;
			if (!responsesByPage.has(page)) {
				responsesByPage.set(page, []);
			}
			responsesByPage.get(page)?.push(resp);
		}
	});

	// Sort pages
	const sortedPages = Array.from(responsesByPage.keys()).sort((a, b) => a - b);

	// Generate response HTML
	let responsesHtml = '';

	sortedPages.forEach((pageNum, pageIndex) => {
		if (pageIndex > 0) {
			responsesHtml += '<div style="margin: 20px 0; border-top: 1px solid #ddd;"></div>';
		}

		const responses = responsesByPage.get(pageNum) || [];

		responses.forEach((resp) => {
			const respTyped = resp as { expand?: { question?: { title?: string } } };
			const questionTitle = stripHtml(respTyped.expand?.question?.title || '');
			const responseText = getResponseRepresentation(
				resp as import('$lib/response-repr').ExpandedAnswer
			);

			if (questionTitle) {
				responsesHtml += `
					<div style="margin-bottom: 20px;">
						<div style="font-weight: bold; color: #333; margin-bottom: 8px; padding: 8px; background-color: #f8f9fa; border-left: 3px solid #007bff;">
							${questionTitle}
						</div>
						<div style="padding: 8px; background-color: #fff; border: 1px solid #e9ecef; border-radius: 4px;">
							${responseText || '<em style="color: #666;">No response</em>'}
						</div>
					</div>
				`;
			}
		});
	});

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Application Submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

	<div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
		<h1 style="color: #007bff; margin-bottom: 10px;">Application Submitted Successfully</h1>
		<p style="color: #666; font-size: 16px;">Your application has been received and is now under review</p>
	</div>

	<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
		<h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">Event</h2>
		<div style="font-size: 18px; font-weight: 600; color: #007bff;">${eventName}</div>
	</div>

	<div style="margin-bottom: 30px;">
		<h2 style="color: #333; margin-bottom: 20px;">Your Responses</h2>
		${responsesHtml || '<p style="color: #666; font-style: italic;">No responses recorded.</p>'}
	</div>



	<div style="margin-top: 40px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e9ecef; padding-top: 20px;">
		<p>This is an automated message. Please do not reply to this email.</p>
		<p style="margin: 5px 0;">If you have any questions, please contact the event organizers.</p>
	</div>

</body>
</html>
	`.trim();
}
