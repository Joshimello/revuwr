import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { applicationExportRequestSchema } from '$lib/server/export/schema';
import {
	ExportRequestError,
	getAuthenticatedAdmin,
	loadApplicationExport
} from '$lib/server/export/data';
import { generateApplicationWorkbook } from '$lib/server/export/xlsx';
import { generateApplicationPdf } from '$lib/server/export/pdf';
import { getPdfFont } from '$lib/server/export/font';
import { sanitizeFilename } from '$lib/server/export/normalize';
import { ZipArchive } from 'archiver';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { ZodError } from 'zod';

function datedFilename(eventName: string, extension: string): string {
	const date = new Date().toISOString().slice(0, 10);
	return `${sanitizeFilename(eventName, 'event')}-applications-${date}.${extension}`;
}

function contentDisposition(filename: string): string {
	const fallback = filename.replace(/[^\x20-\x7E]/g, '_').replaceAll('"', "'");
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function downloadResponse(body: BodyInit, filename: string, contentType: string): Response {
	return new Response(body, {
		headers: {
			'Cache-Control': 'no-store',
			'Content-Disposition': contentDisposition(filename),
			'Content-Type': contentType,
			'X-Content-Type-Options': 'nosniff'
		}
	});
}

function uniquePdfFilename(base: string, id: string, used: Set<string>): string {
	let filename = `${sanitizeFilename(base, id)}.pdf`;
	if (!used.has(filename.toLowerCase())) {
		used.add(filename.toLowerCase());
		return filename;
	}

	filename = `${sanitizeFilename(base, id)}-${id.slice(0, 8)}.pdf`;
	used.add(filename.toLowerCase());
	return filename;
}

export const POST: RequestHandler = async ({ request }) => {
	let temporaryDirectory: string | undefined;

	try {
		const adminPb = await getAuthenticatedAdmin(request);
		const payload = applicationExportRequestSchema.parse(await request.json());
		const data = await loadApplicationExport(adminPb, payload);

		if (payload.format === 'xlsx') {
			const workbook = await generateApplicationWorkbook(
				data,
				payload.fields,
				payload.xlsxRepresentation
			);
			return downloadResponse(
				workbook,
				datedFilename(data.eventName, 'xlsx'),
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
		}

		const font = await getPdfFont();
		if (data.applications.length === 1) {
			const application = data.applications[0];
			const pdf = await generateApplicationPdf(data, application, payload.fields, font);
			return downloadResponse(pdf, `${application.filenameBase}.pdf`, 'application/pdf');
		}

		temporaryDirectory = await mkdtemp(join(tmpdir(), 'revuwr-export-'));
		const usedFilenames = new Set<string>();
		const generatedFilenames: string[] = [];

		for (const application of data.applications) {
			const filename = uniquePdfFilename(application.filenameBase, application.id, usedFilenames);
			const pdf = await generateApplicationPdf(data, application, payload.fields, font);
			await writeFile(join(temporaryDirectory, filename), pdf);
			generatedFilenames.push(filename);
		}

		const archive = new ZipArchive({ zlib: { level: 9 } });
		for (const filename of generatedFilenames) {
			archive.append(createReadStream(join(temporaryDirectory, filename)), { name: filename });
		}

		const directoryToClean = temporaryDirectory;
		temporaryDirectory = undefined;
		const cleanup = () => {
			void rm(directoryToClean, { recursive: true, force: true });
		};
		archive.once('end', cleanup);
		archive.once('error', cleanup);
		request.signal.addEventListener(
			'abort',
			() => {
				archive.abort();
				cleanup();
			},
			{ once: true }
		);

		const stream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;
		void archive.finalize();
		return downloadResponse(stream, datedFilename(data.eventName, 'zip'), 'application/zip');
	} catch (error) {
		if (temporaryDirectory) {
			await rm(temporaryDirectory, { recursive: true, force: true });
		}

		if (error instanceof ExportRequestError) {
			return json({ message: error.message }, { status: error.status });
		}

		if (error instanceof ZodError) {
			return json(
				{ message: error.issues[0]?.message || 'Invalid export request' },
				{ status: 400 }
			);
		}

		console.error('Application export failed', error);
		return json({ message: 'The export could not be generated' }, { status: 500 });
	}
};
