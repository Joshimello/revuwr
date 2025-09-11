<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Table from '$lib/components/ui/table';
	export let value: {
		name: string;
		username: string;
		email: string;
		phone: string;
		college: string;
		year: string;
		status: string;
	}[];
</script>

<Table.Root class="border">
	<Table.Header>
		<Table.Row>
			<Table.Head>User</Table.Head>
			<Table.Head>Contact</Table.Head>
			<Table.Head>Status</Table.Head>
			<Table.Head>Tags</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each value as member}
			<Table.Row>
				<Table.Cell>
					<div class="font-medium">
						{member.name}
					</div>
					<div class="hidden text-sm text-muted-foreground md:inline">
						{member.username}
					</div>
				</Table.Cell>
				<Table.Cell>
					<div class="font-medium">
						{member.email}
					</div>
					<div class="hidden text-sm text-muted-foreground md:inline">
						{member.phone}
					</div>
				</Table.Cell>
				<Table.Cell>
					<div class="font-medium">
						{member.college}
					</div>
					<div class="hidden text-sm text-muted-foreground md:inline">
						Y{member.year}
					</div>
				</Table.Cell>
				<Table.Cell>
					<Badge variant="secondary">
						{member.status}
					</Badge>
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
