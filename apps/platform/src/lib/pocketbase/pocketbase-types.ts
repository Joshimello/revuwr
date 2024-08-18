/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Answers = "answers",
	Applications = "applications",
	Events = "events",
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
	created: IsoDateString
	updated: IsoDateString
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

export type AnswersRecord<Tresponse = unknown> = {
	application?: RecordIdString
	comment?: string
	files?: string[]
	question?: RecordIdString
	response?: null | Tresponse
	status?: string
	valid?: boolean
}

export type ApplicationsRecord = {
	adminNote?: string
	comment?: string
	event?: RecordIdString
	responder?: RecordIdString
	response?: RecordIdString[]
	serial?: number
	status?: string
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
export type EventsRecord = {
	afterStartDate?: EventsAfterStartDateOptions
	approvedCount?: number
	beforeStartDate?: EventsBeforeStartDateOptions
	description?: string
	endDate?: IsoDateString
	image?: string
	moreInfo?: string
	name?: string
	questions?: RecordIdString[]
	responseLimit?: number
	responsePrefix?: string
	startDate?: IsoDateString
	status?: EventsStatusOptions
	targetAudience?: EventsTargetAudienceOptions
}

export type NotificationsRecord = {
	application?: RecordIdString
	link?: string
	message?: string
	target?: RecordIdString
}

export type QuestionsRecord<Toptions = unknown> = {
	count?: number
	description?: HTMLString
	options?: null | Toptions
	page?: number
	required?: boolean
	title?: HTMLString
	type?: string
}

export type ReviewersRecord = never

export type ReviewsRecord<Treview = unknown> = {
	applications?: RecordIdString[]
	endDate?: IsoDateString
	questions?: RecordIdString[]
	review?: null | Treview
	reviewerEmail?: string
	shareResponder?: boolean
	status?: string
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
	avatar?: string
	department?: string
	disableNotify?: boolean
	init?: boolean
	language?: UsersLanguageOptions
	name?: string
	occupation?: UsersOccupationOptions
	phone?: string
	year?: string
}

// Response types include system fields and match responses from the PocketBase API
export type AnswersResponse<Tresponse = unknown, Texpand = unknown> = Required<AnswersRecord<Tresponse>> & BaseSystemFields<Texpand>
export type ApplicationsResponse<Texpand = unknown> = Required<ApplicationsRecord> & BaseSystemFields<Texpand>
export type EventsResponse<Texpand = unknown> = Required<EventsRecord> & BaseSystemFields<Texpand>
export type NotificationsResponse<Texpand = unknown> = Required<NotificationsRecord> & BaseSystemFields<Texpand>
export type QuestionsResponse<Toptions = unknown, Texpand = unknown> = Required<QuestionsRecord<Toptions>> & BaseSystemFields<Texpand>
export type ReviewersResponse<Texpand = unknown> = Required<ReviewersRecord> & AuthSystemFields<Texpand>
export type ReviewsResponse<Treview = unknown, Texpand = unknown> = Required<ReviewsRecord<Treview>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	answers: AnswersRecord
	applications: ApplicationsRecord
	events: EventsRecord
	notifications: NotificationsRecord
	questions: QuestionsRecord
	reviewers: ReviewersRecord
	reviews: ReviewsRecord
	users: UsersRecord
}

export type CollectionResponses = {
	answers: AnswersResponse
	applications: ApplicationsResponse
	events: EventsResponse
	notifications: NotificationsResponse
	questions: QuestionsResponse
	reviewers: ReviewersResponse
	reviews: ReviewsResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: 'answers'): RecordService<AnswersResponse>
	collection(idOrName: 'applications'): RecordService<ApplicationsResponse>
	collection(idOrName: 'events'): RecordService<EventsResponse>
	collection(idOrName: 'notifications'): RecordService<NotificationsResponse>
	collection(idOrName: 'questions'): RecordService<QuestionsResponse>
	collection(idOrName: 'reviewers'): RecordService<ReviewersResponse>
	collection(idOrName: 'reviews'): RecordService<ReviewsResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
