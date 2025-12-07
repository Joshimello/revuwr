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
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
	? T extends unknown
		? { expand?: unknown }
		: { expand: T }
	: { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated: IsoAutoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated: IsoAutoDateString
}

export type MfasRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	method: string
	recordRef: string
	updated: IsoAutoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created: IsoAutoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated: IsoAutoDateString
}

export type SuperusersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	verified?: boolean
}

export type AnswersRecord<Tresponse = unknown> = {
	application?: RecordIdString
	comment?: string
	created: IsoAutoDateString
	id: string
	question?: RecordIdString
	response?: null | Tresponse
	status?: string
	updated: IsoAutoDateString
	valid?: boolean
}

export type ApplicationsRecord = {
	adminColor?: string
	adminNote?: string
	comment?: string
	created: IsoAutoDateString
	event?: RecordIdString
	id: string
	responder?: RecordIdString
	response?: RecordIdString[]
	serial?: number
	status?: string
	updated: IsoAutoDateString
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
	created: IsoAutoDateString
	description?: string
	endDate?: IsoDateString
	id: string
	image?: FileNameString
	moreInfo?: string
	name?: string
	questions?: RecordIdString[]
	reprQuestion?: RecordIdString
	responseLimit?: number
	responsePrefix?: string
	startDate?: IsoDateString
	status?: EventsStatusOptions
	targetAudience?: EventsTargetAudienceOptions
	terms?: null | Tterms
	updated: IsoAutoDateString
}

export type FilesRecord = {
	created: IsoAutoDateString
	file?: FileNameString[]
	id: string
	updated: IsoAutoDateString
	user?: RecordIdString
}

export type NotificationsRecord = {
	application?: RecordIdString
	created: IsoAutoDateString
	id: string
	link?: string
	message?: string
	target?: RecordIdString
	updated: IsoAutoDateString
}

export type QuestionsRecord<Tconditionanswer = unknown, Toptions = unknown> = {
	conditional?: boolean
	conditionanswer?: null | Tconditionanswer
	conditionquestion?: RecordIdString[]
	count?: number
	created: IsoAutoDateString
	description?: HTMLString
	id: string
	options?: null | Toptions
	page?: number
	required?: boolean
	title?: HTMLString
	type?: string
	updated: IsoAutoDateString
}

export type ReviewersRecord = {
	created: IsoAutoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated: IsoAutoDateString
	username: string
	verified?: boolean
}

export type ReviewsRecord<Treview = unknown> = {
	applications?: RecordIdString[]
	created: IsoAutoDateString
	endDate?: IsoDateString
	id: string
	questions?: RecordIdString[]
	review?: null | Treview
	reviewerEmail?: string
	shareResponder?: boolean
	status?: string
	updated: IsoAutoDateString
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
	avatar?: FileNameString
	birthday?: IsoDateString
	country?: string
	created: IsoAutoDateString
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
	updated: IsoAutoDateString
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

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<{
	// Omit AutoDate fields
	[K in keyof T as Extract<T[K], IsoAutoDateString> extends never ? K : never]: 
		// Convert FileNameString to File
		T[K] extends infer U ? 
			U extends (FileNameString | FileNameString[]) ? 
				U extends any[] ? File[] : File 
			: U
		: never
}, 'id'>

// Create type for Auth collections
export type CreateAuth<T> = {
	id?: RecordIdString
	email: string
	emailVisibility?: boolean
	password: string
	passwordConfirm: string
	verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
	id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
	email?: string
	emailVisibility?: boolean
	oldPassword?: string
	password?: string
	passwordConfirm?: string
	verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
	Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? CreateAuth<CollectionRecords[T]>
		: CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses> =
	CollectionResponses[T] extends AuthSystemFields
		? UpdateAuth<CollectionRecords[T]>
		: UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
	collection<T extends keyof CollectionResponses>(
		idOrName: T
	): RecordService<CollectionResponses[T]>
} & PocketBase
