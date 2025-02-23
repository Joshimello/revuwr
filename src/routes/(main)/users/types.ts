import type { ApplicationsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";

export type ExpandedUsersResponse = UsersResponse<{
  applications: ApplicationsResponse[];
}>

export type CreateUserDetails = {
  userId: string,
  name: string,
  email: string,
  password: string
}