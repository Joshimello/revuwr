<script lang="ts">
	import { page } from '$app/stores';
	import CollegePicker from '$lib/components/college-picker.svelte';
	import CountryPicker from '$lib/components/country-picker.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages.js';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { CirclePlus, Edit, Trash } from 'lucide-svelte';
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
			return [false, m.member_at_least_required({ count: options.minCount })];
		}
		if (options.isControlCount && value && value.length > options.maxCount) {
			return [false, m.member_maximum_allowed({ count: options.maxCount })];
		}
		if (question.required && value.length == 0) {
			return [false, m.member_please_fill_field()];
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
	let editIndex = -1;

	const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	$: isPhoneValid = phoneRegex.test(newMember.phone);
	$: isEmailValid = emailRegex.test(newMember.email);
	$: isDuplicateUsername =
		value &&
		value.some((member, index) => member.username === newMember.username && index !== editIndex);
	$: isFormValid =
		newMember.name &&
		newMember.username &&
		newMember.department &&
		newMember.country &&
		isPhoneValid &&
		isEmailValid &&
		!isDuplicateUsername;

	const handleCollegeChange = (value: string) => {
		newMember.department = value;
	};
	const handleCountryChange = (value: string) => {
		newMember.country = value;
	};

	const handleAdd = () => {
		open = false;
		if (editIndex >= 0) {
			// Editing existing member
			value[editIndex] = { ...newMember };
			value = [...value]; // Trigger reactivity
			editIndex = -1;
		} else {
			// Adding new member
			value = [...value, newMember];
		}
		newMember = {
			name: '',
			username: '',
			email: '',
			phone: '',
			department: '',
			country: ''
		};
	};

	const handleEdit = (index: number) => {
		editIndex = index;
		newMember = { ...value[index] };
		open = true;
	};
</script>

{#if value}
	<div class="rounded-md border">
		<div class="overflow-x-auto">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="whitespace-nowrap">{m.member_field_member()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.member_field_contact()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.member_field_dept_grade()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.member_field_country()}</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each value as member, index}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">{member.name}</div>
								<div class="hidden text-sm text-muted-foreground md:inline">
									{member.username}
								</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">{member.email}</div>
								<div class="hidden text-sm text-muted-foreground md:inline">
									{member.phone}
								</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">{member.department}</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								<Badge variant="secondary">{member.country}</Badge>
							</Table.Cell>
							<Table.Cell class="text-end">
								<div class="flex items-center gap-1">
									<Button {disabled} size="icon" variant="ghost" on:click={() => handleEdit(index)}>
										<Edit size="16" />
									</Button>
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
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="flex justify-center border-t p-1">
			<Dialog.Root bind:open>
				<Dialog.Trigger asChild let:builder>
					<Button {disabled} variant="ghost" class="w-full" builders={[builder]}>
						<CirclePlus size="16" />
						{m.member_add_member()}
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>
							{editIndex >= 0 ? m.member_editing_member() : m.member_adding_new_member()}
						</Dialog.Title>
						<Dialog.Description></Dialog.Description>
					</Dialog.Header>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<div class="">
							<Label>{m.member_name()}</Label>
							<Input bind:value={newMember.name} />
						</div>
						<div class="">
							<Label>
								{m.member_student_staff_id()}
								{#if newMember.username && isDuplicateUsername}
									<span class="text-destructive">{m.member_username_exists()}</span>
								{/if}
							</Label>
							<Input bind:value={newMember.username} />
						</div>
						<div class="">
							<Label>
								{m.member_email()}
								{#if newMember.email && !isEmailValid}
									<span class="text-destructive">{m.member_invalid_email()}</span>
								{/if}
							</Label>
							<Input bind:value={newMember.email} />
						</div>
						<div class="">
							<Label>
								{m.member_phone_number()}
								{#if newMember.phone && !isPhoneValid}
									<span class="text-destructive">{m.member_invalid_phone()}</span>
								{/if}
							</Label>
							<Input bind:value={newMember.phone} />
						</div>
						<div class="md:col-span-2">
							<Label>{m.member_department()}</Label>
							<CollegePicker
								bind:value={newMember.department}
								onCollegeChange={handleCollegeChange}
							/>
						</div>
						<div class="md:col-span-2">
							<Label>{m.member_country()}</Label>
							<CountryPicker
								bind:value={newMember.country}
								onCountryChange={handleCountryChange}
								lang="en"
							/>
						</div>
						<Button class="mt-6 md:col-span-2" on:click={handleAdd} disabled={!isFormValid}>
							{editIndex >= 0 ? m.member_update_member_button() : m.member_add_member_button()}
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
{/if}
