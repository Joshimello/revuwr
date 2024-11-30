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
import Budget from './fields/budget.svelte';

import * as m from '$lib/paraglide/messages.js';
import { type ComponentType } from 'svelte';

import {
	Minus,
	Text,
	CheckCircle,
	CopyCheck,
	Image as FileUp,
	Mail,
	Phone as PhoneIcon,
	UsersRound,
	CalendarRange,
	InfoIcon,
	TableIcon
} from 'lucide-svelte';

export default {
	info: {
		icon: InfoIcon,
		label: m.info(),
		component: Info
	},
	shortText: {
		icon: Minus,
		label: m.short_text(),
		component: ShortText
	},
	longText: {
		icon: Text,
		label: m.long_text(),
		component: LongText
	},
	email: {
		icon: Mail,
		label: m.email(),
		component: Email
	},
	phone: {
		icon: PhoneIcon,
		label: m.phone(),
		component: Phone
	},
	file: {
		icon: FileUp,
		label: m.file(),
		component: File
	},
	checkbox: {
		icon: CopyCheck,
		label: m.multiple_choice(),
		component: Checkbox
	},
	radio: {
		icon: CheckCircle,
		label: m.single_choice(),
		component: Radio
	},
	budget: {
		icon: TableIcon,
		label: m.budget(),
		component: Budget
	},
	member: {
		icon: UsersRound,
		label: m.team_members(),
		component: Member
	},
	activity: {
		icon: CalendarRange,
		label: m.activity(),
		component: Activity
	}
} as {
	[key: string]: {
		icon: ComponentType;
		label: string;
		component: ComponentType;
	};
};
