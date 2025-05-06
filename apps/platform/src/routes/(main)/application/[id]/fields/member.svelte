<script lang="ts">
	import { page } from '$app/stores';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import DepartmentPicker from '$lib/components/department-picker.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { CirclePlus, Trash } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	const options = question.options as {
		isControlCount: boolean;
		minCount: number;
		maxCount: number;
	};

	export let disabled = false;
	export let value: {
		name: string;
		username: string;
		email: string;
		phone: string;
		department: string;
		country: string;
	}[];

	export const checkValid = () => {
		if (value == null || disabled) {
			return [false, ''];
		}
		if (options.isControlCount && value && value.length < options.minCount) {
			return [false, `At least ${options.minCount} members required`];
		}
		if (options.isControlCount && value && value.length > options.maxCount) {
			return [false, `Maximum ${options.maxCount} members allowed`];
		}
		if (question.required && value.length == 0) {
			return [false, 'Please fill in this field'];
		}
		return [true, ''];
	};

	const { user } = $page.data;

	onMount(() => {
		if (!value) {
			value = [
				{
					name: user.name,
					username: user.username,
					email: user.email,
					phone: user.phone,
					department: user.department,
					country: ''
				}
			];
		}
	});

	let newMember = {
		name: '',
		username: '',
		email: '',
		phone: '',
		department: '',
		country: ''
	};

	let open = false;

	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	$: isPhoneValid = phoneRegex.test(newMember.phone);
	$: isEmailValid = emailRegex.test(newMember.email);
	$: isFormValid =
		newMember.name &&
		newMember.username &&
		newMember.department &&
		newMember.country &&
		isPhoneValid &&
		isEmailValid;

	const handleDepartmentChange = (value: string) => {
		newMember.department = value;
	};
	const handleCountryChange = (value: string) => {
		newMember.country = value;
	};

	const handleAdd = () => {
		open = false;
		value = [...value, newMember];
		newMember = {
			name: '',
			username: '',
			email: '',
			phone: '',
			department: '',
			country: ''
		};
	};
</script>

{#if value}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Member</Table.Head>
					<Table.Head>Contact</Table.Head>
					<Table.Head>Dept/Grade</Table.Head>
					<Table.Head>Country</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each value as member, index}
					<Table.Row>
						<Table.Cell>
							<div class="font-medium">{member.name}</div>
							<div class="hidden text-sm text-muted-foreground md:inline">
								{member.username}
							</div>
						</Table.Cell>
						<Table.Cell>
							<div class="font-medium">{member.email}</div>
							<div class="hidden text-sm text-muted-foreground md:inline">
								{member.phone}
							</div>
						</Table.Cell>
						<Table.Cell>
							<div class="font-medium">{member.department}</div>
						</Table.Cell>
						<Table.Cell>
							<Badge variant="secondary">{member.country}</Badge>
						</Table.Cell>
						<Table.Cell class="text-end">
							{#if index > 0}
								<Button
									{disabled}
									size="icon"
									variant="ghost"
									on:click={() => {
										value = value.filter((_, i) => i !== index);
									}}
								>
									<Trash size="16" />
								</Button>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Dialog.Root bind:open>
				<Dialog.Trigger asChild let:builder>
					<Button {disabled} variant="ghost" class="w-full" builders={[builder]}>
						<CirclePlus size="16" />
						Add Member
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Adding a new member</Dialog.Title>
						<Dialog.Description></Dialog.Description>
					</Dialog.Header>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<div class="">
							<Label>Name</Label>
							<Input bind:value={newMember.name} />
						</div>
						<div class="">
							<Label>Student / Staff ID</Label>
							<Input bind:value={newMember.username} />
						</div>
						<div class="">
							<Label>
								Email
								{#if newMember.email && !isEmailValid}
									<span class="text-destructive">(Invalid email format)</span>
								{/if}
							</Label>
							<Input bind:value={newMember.email} />
						</div>
						<div class="">
							<Label>
								Phone number
								{#if newMember.phone && !isPhoneValid}
									<span class="text-destructive">(Invalid mobile number)</span>
								{/if}
							</Label>
							<Input bind:value={newMember.phone} />
						</div>
						<div class="md:col-span-2">
							<Label>Department</Label>
							<DepartmentPicker
								bind:value={newMember.department}
								onDepartmentChange={handleDepartmentChange}
							/>
						</div>
						<div class="md:col-span-2">
							<Label>Country</Label>
							<CountryPicker
								bind:value={newMember.country}
								onCountryChange={handleCountryChange}
								lang="en"
							/>
						</div>
						<Button class="mt-6 md:col-span-2" on:click={handleAdd} disabled={!isFormValid}>
							Add member
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
{/if}
