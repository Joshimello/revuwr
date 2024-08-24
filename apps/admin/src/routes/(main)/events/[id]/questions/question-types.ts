import ShortText from "./fields/short-text.svelte";
import LongText from "./fields/long-text.svelte";
import Email from "./fields/email.svelte";
import Phone from "./fields/phone.svelte";
import Image from "./fields/image.svelte";
import File from "./fields/file.svelte";
import Checkbox from "./fields/checkbox.svelte";
import Radio from "./fields/radio.svelte";
import Member from "./fields/member.svelte";
import Table from "./fields/table.svelte";
import Activity from "./fields/activity.svelte";
import Budget from "./fields/budget.svelte";
import Info from "./fields/info.svelte";
import * as m from '$lib/paraglide/messages.js'

import { 
  Minus, Text, CheckCircle, CopyCheck, 
  Image as ImageIcon, FileUp, Mail, 
  Phone as PhoneIcon, UsersRound, TableProperties, 
  CalendarRange,
  ReceiptText,
  InfoIcon
} from "lucide-svelte";

import { type ComponentType } from "svelte"

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
  image: {
    icon: ImageIcon,
    label: m.image(),
    component: Image
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
  member: {
    icon: UsersRound,
    label: m.team_members(),
    component: Member
  },
  activity: {
    icon: CalendarRange,
    label: m.activity(),
    component: Activity
  },
  // budget: {
  //   icon: ReceiptText,
  //   label: "Budget",
  //   component: Budget
  // }
  // table: {
  //   icon: TableProperties,
  //   label: "Table",
  //   component: Table
  // }
} as {
  [key: string]: {
    icon: ComponentType,
    label: string,
    component: ComponentType
  }
}