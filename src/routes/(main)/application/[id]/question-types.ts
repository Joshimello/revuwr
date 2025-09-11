import ShortText from './fields/short-text.svelte';
import LongText from './fields/long-text.svelte';
import Email from './fields/email.svelte';
import Phone from './fields/phone.svelte';
import File from './fields/file.svelte';
import Checkbox from './fields/checkbox.svelte';
import Radio from './fields/radio.svelte';
import Member from './fields/member.svelte';
import Activity from './fields/activity.svelte';
import Info from './fields/info.svelte';

import {
	Minus,
	Text,
	CheckCircle,
	CopyCheck,
	Image as ImageIcon,
	FileUp,
	Mail,
	Phone as PhoneIcon,
	UsersRound,
	TableProperties,
	CalendarRange,
	ReceiptText,
	InfoIcon,
	TableIcon
} from 'lucide-svelte';

import { type ComponentType } from 'svelte';
import Budget from './fields/budget.svelte';

export default {
	info: {
		icon: InfoIcon,
		label: 'Info',
		component: Info
	},
	shortText: {
		icon: Minus,
		label: 'Short Text',
		component: ShortText
	},
	longText: {
		icon: Text,
		label: 'Long Text',
		component: LongText
	},
	email: {
		icon: Mail,
		label: 'Email',
		component: Email
	},
	phone: {
		icon: PhoneIcon,
		label: 'Phone',
		component: Phone
	},
	file: {
		icon: FileUp,
		label: 'File',
		component: File
	},
	checkbox: {
		icon: CopyCheck,
		label: 'Multiple Choice',
		component: Checkbox
	},
	radio: {
		icon: CheckCircle,
		label: 'Single Choice',
		component: Radio
	},
	member: {
		icon: UsersRound,
		label: 'Team Members',
		component: Member
	},
	activity: {
		icon: CalendarRange,
		label: 'Activity',
		component: Activity
	},
	budget: {
		icon: TableIcon,
		label: 'Budget',
		component: Budget
	}
} as {
	[key: string]: {
		icon: ComponentType;
		label: string;
		component: ComponentType;
	};
};
