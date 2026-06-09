<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	// Function to open email HTML in new window for better testing
	function openInNewWindow() {
		const newWindow = window.open('', '_blank');
		if (newWindow) {
			newWindow.document.write(data.emailHtml);
			newWindow.document.close();
		}
	}
</script>

<svelte:head>
	<title>Test Email - Application {data.application.id}</title>
</svelte:head>

<div class="container">
	<div class="header">
		<h1>Email Test Preview</h1>
		<div class="application-info">
			<p><strong>Application ID:</strong> {data.application.id}</p>
			{#if data.application.serial}
				<p><strong>Serial:</strong> {data.application.serial}</p>
			{/if}
			{#if data.application.eventName}
				<p><strong>Event:</strong> {data.application.eventName}</p>
			{/if}
			{#if data.application.responderName}
				<p><strong>Responder:</strong> {data.application.responderName}</p>
			{/if}
			{#if data.application.responderEmail}
				<p><strong>Email:</strong> {data.application.responderEmail}</p>
			{/if}
		</div>
		<div class="actions">
			<button on:click={openInNewWindow} class="btn-primary">
				Open in New Window
			</button>
		</div>
	</div>

	<div class="email-preview">
		<div class="email-frame">
			<!-- Display the email HTML directly -->
			{@html data.emailHtml}
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		background: #f8f9fa;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 20px;
		border: 1px solid #e9ecef;
	}

	.header h1 {
		margin: 0 0 15px 0;
		color: #333;
		font-size: 24px;
	}

	.application-info {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 10px;
		margin-bottom: 15px;
	}

	.application-info p {
		margin: 5px 0;
		font-size: 14px;
		color: #666;
	}

	.actions {
		display: flex;
		gap: 10px;
	}

	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.2s;
	}

	.btn-primary:hover {
		background: #0056b3;
	}

	.email-preview {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.email-frame {
		/* Reset styles to prevent parent CSS from affecting email content */
		all: initial;
		display: block;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		padding: 20px;
		background: white;
		min-height: 500px;
	}

	/* Override some global styles that might interfere with email display */
	.email-frame :global(*) {
		box-sizing: border-box;
	}

	.email-frame :global(table) {
		border-collapse: collapse;
	}

	/* Responsive design for smaller screens */
	@media (max-width: 768px) {
		.container {
			padding: 10px;
		}

		.header {
			padding: 15px;
		}

		.application-info {
			grid-template-columns: 1fr;
		}

		.email-frame {
			padding: 10px;
		}
	}
</style>
