/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	Answers = "answers",
	Applications = "applications",
	Colleges = "colleges",
	Events = "events",
	Files = "files",
	Notifications = "notifications",
	Questions = "questions",
	Reviewers = "reviewers",
	Reviews = "reviews",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type AnswersRecord<Tresponse = unknown> = {
	application?: RecordIdString
	comment?: string
	created?: IsoDateString
	id: string
	question?: RecordIdString
	response?: null | Tresponse
	status?: string
	updated?: IsoDateString
	valid?: boolean
}

export type ApplicationsRecord = {
	adminColor?: string
	adminNote?: string
	comment?: string
	created?: IsoDateString
	event?: RecordIdString
	id: string
	responder?: RecordIdString
	response?: RecordIdString[]
	serial?: number
	status?: string
	updated?: IsoDateString
}

export type CollegesRecord = {
	en?: string
	id: string
	zh?: string
}

export enum EventsStatusOptions {
	"active" = "active",
	"archived" = "archived",
}

export enum EventsTargetAudienceOptions {
	"all" = "all",
	"students" = "students",
	"teachers" = "teachers",
}

export enum EventsBeforeStartDateOptions {
	"disallow" = "disallow",
	"allow" = "allow",
}

export enum EventsAfterStartDateOptions {
	"disallow" = "disallow",
	"allow" = "allow",
}
export type EventsRecord<Tterms = unknown> = {
	afterStartDate?: EventsAfterStartDateOptions
	approvedCount?: number
	beforeStartDate?: EventsBeforeStartDateOptions
	created?: IsoDateString
	description?: string
	endDate?: IsoDateString
	id: string
	image?: string
	moreInfo?: string
	name?: string
	questions?: RecordIdString[]
	responseLimit?: number
	responsePrefix?: string
	startDate?: IsoDateString
	status?: EventsStatusOptions
	targetAudience?: EventsTargetAudienceOptions
	terms?: null | Tterms
	updated?: IsoDateString
}

export type FilesRecord = {
	created?: IsoDateString
	file?: string[]
	id: string
	updated?: IsoDateString
	user?: RecordIdString
}

export type NotificationsRecord = {
	application?: RecordIdString
	created?: IsoDateString
	id: string
	link?: string
	message?: string
	target?: RecordIdString
	updated?: IsoDateString
}

export type QuestionsRecord<Tconditionanswer = unknown, Toptions = unknown> = {
	conditional?: boolean
	conditionanswer?: null | Tconditionanswer
	conditionquestion?: RecordIdString[]
	count?: number
	created?: IsoDateString
	description?: HTMLString
	id: string
	options?: null | Toptions
	page?: number
	required?: boolean
	title?: HTMLString
	type?: string
	updated?: IsoDateString
}

export type ReviewersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	username: string
	verified?: boolean
}

export type ReviewsRecord<Treview = unknown> = {
	applications?: RecordIdString[]
	created?: IsoDateString
	endDate?: IsoDateString
	id: string
	questions?: RecordIdString[]
	review?: null | Treview
	reviewerEmail?: string
	shareResponder?: boolean
	status?: string
	updated?: IsoDateString
}

export enum UsersOccupationOptions {
	"student" = "student",
	"teacher" = "teacher",
}

export enum UsersLanguageOptions {
	"en" = "en",
	"zh" = "zh",
}
export type UsersRecord = {
	applications?: RecordIdString[]
	avatar?: string
	birthday?: IsoDateString
	country?: string
	created?: IsoDateString
	department?: string
	dept?: string
	disableNotify?: boolean
	email?: string
	emailVisibility?: boolean
	id: string
	init?: boolean
	language?: UsersLanguageOptions
	name?: string
	nameEn?: string
	occupation?: UsersOccupationOptions
	password: string
	phone?: string
	tokenKey: string
	updated?: IsoDateString
	username: string
	verified?: boolean
	year?: string
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type AnswersResponse<Tresponse = unknown, Texpand = unknown> = Required<AnswersRecord<Tresponse>> & BaseSystemFields<Texpand>
export type ApplicationsResponse<Texpand = unknown> = Required<ApplicationsRecord> & BaseSystemFields<Texpand>
export type CollegesResponse<Texpand = unknown> = Required<CollegesRecord> & BaseSystemFields<Texpand>
export type EventsResponse<Tterms = unknown, Texpand = unknown> = Required<EventsRecord<Tterms>> & BaseSystemFields<Texpand>
export type FilesResponse<Texpand = unknown> = Required<FilesRecord> & BaseSystemFields<Texpand>
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>
export type QuestionsResponse<Tconditionanswer = unknown, Toptions = unknown, Texpand = unknown> = Required<QuestionsRecord<Tconditionanswer, Toptions>> & BaseSystemFields<Texpand>
export type ReviewersResponse<Texpand = unknown> = Required<ReviewersRecord> & AuthSystemFields<Texpand>
export type ReviewsResponse<Treview = unknown, Texpand = unknown> = Required<ReviewsRecord<Treview>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	answers: AnswersRecord
	applications: ApplicationsRecord
	colleges: CollegesRecord
	events: EventsRecord
	files: FilesRecord
	notifications: NotificationsRecord
	questions: QuestionsRecord
	reviewers: ReviewersRecord
	reviews: ReviewsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	answers: AnswersResponse
	applications: ApplicationsResponse
	colleges: CollegesResponse
	events: EventsResponse
	files: FilesResponse
	notifications: NotificationsResponse
	questions: QuestionsResponse
	reviewers: ReviewersResponse
	reviews: ReviewsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'answers'): RecordService<AnswersResponse>
	collection(idOrName: 'applications'): RecordService<ApplicationsResponse>
	collection(idOrName: 'colleges'): RecordService<CollegesResponse>
	collection(idOrName: 'events'): RecordService<EventsResponse>
	collection(idOrName: 'files'): RecordService<FilesResponse>
	collection(idOrName: 'notifications'): RecordService<NotificationsResponse>
	collection(idOrName: 'questions'): RecordService<QuestionsResponse>
	collection(idOrName: 'reviewers'): RecordService<ReviewersResponse>
	collection(idOrName: 'reviews'): RecordService<ReviewsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
