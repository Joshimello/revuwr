# Breadcrumb System

This document explains how to use the breadcrumb system in the admin application.

## Overview

The breadcrumb system uses a simple store-based approach where child routes set their own breadcrumbs instead of the layout trying to compute them automatically. This gives each route full control over its breadcrumb display and ensures accurate, meaningful navigation paths.

## Usage

### 1. Import the setBreadcrumbs function

```typescript
import { setBreadcrumbs } from '$lib/breadcrumbs.js';
```

### 2. Set breadcrumbs in your route

Call `setBreadcrumbs()` with an array of breadcrumb items. The "Admin" root breadcrumb is automatically added, so you only need to define your route-specific breadcrumbs:

```typescript
// Simple example - Events list page
setBreadcrumbs([
	{
		text: 'Events',
		href: `${PUBLIC_BASE_PATH}/events`
	}
]);
```

### 3. Reactive breadcrumbs for data-dependent routes

For routes that display dynamic data (like specific events), use reactive statements to update breadcrumbs when data loads:

```typescript
// Example - Specific event page
$: if (event) {
	setBreadcrumbs([
		{
			text: 'Events',
			href: `${PUBLIC_BASE_PATH}/events`
		},
		{
			text: event.name,
			href: `${PUBLIC_BASE_PATH}/events/${event.id}`
		}
	]);
}
```

### 4. Nested route breadcrumbs

For deeper nested routes, include the full path:

```typescript
// Example - Event settings page
$: if (settings.name) {
	setBreadcrumbs([
		{
			text: 'Events',
			href: `${PUBLIC_BASE_PATH}/events`
		},
		{
			text: settings.name,
			href: `${PUBLIC_BASE_PATH}/events/${$page.params.id}`
		},
		{
			text: 'Settings',
			href: `${PUBLIC_BASE_PATH}/events/${$page.params.id}/settings`
		}
	]);
}
```

## API Reference

### Types

```typescript
interface BreadcrumbItem {
	text: string; // Display text for the breadcrumb
	href: string; // URL to navigate to when clicked
}
```

### Functions

#### `setBreadcrumbs(crumbs: BreadcrumbItem[])`

Sets the breadcrumbs for the current route. Automatically adds the "Admin" root breadcrumb.

**Parameters:**

- `crumbs`: Array of breadcrumb items (without the root "Admin" item)

#### `clearBreadcrumbs()`

Clears all breadcrumbs. Useful for error states or cleanup.

### Store

#### `breadcrumbs`

Readonly store that contains the current breadcrumbs. Subscribe to this in components that need to display breadcrumbs.

## Best Practices

1. **Set breadcrumbs early**: Call `setBreadcrumbs()` as soon as your component loads, even with placeholder text if needed.

2. **Use reactive statements for dynamic data**: When breadcrumbs depend on loaded data, use `$:` to update them reactively.

3. **Provide meaningful text**: Use descriptive text that helps users understand their location and navigate back.

4. **Include full paths**: Each breadcrumb should be a complete navigation path, not just relative to the parent.

5. **Use consistent naming**: Use the same text as your page titles and navigation items.

## Implementation Status

### ✅ Completed Routes:

**Main Routes:**

- `/events` - Events list page
- `/users` - Users list page
- `/users/[id]` - User detail page
- `/settings` - Settings page
- `/events/new` - New event page

**Event Sub-routes:**

- `/events/[id]` - Event detail page
- `/events/[id]/settings` - Event settings page
- `/events/[id]/questions` - Event questions page
- `/events/[id]/responses` - Event responses page
- `/events/[id]/reviews` - Event reviews page
- `/events/[id]/reviews/new` - New review page
- `/events/[id]/terms` - Event terms page

**Export Routes:**

- `/export/csv` - CSV export page
- `/export/pdfs` - PDF export page

**Special Routes:**

- `/response/[id]` - Response detail page (special breadcrumb behavior)

### 🔲 Remaining Routes:

- `/events/[id]/mailing` - Event mailing page
- `/events/[id]/overview` - Event overview page

## Examples

### Static route (Users page)

```typescript
setBreadcrumbs([
	{
		text: 'Users',
		href: `${PUBLIC_BASE_PATH}/users`
	}
]);
```

### Dynamic route (Specific user page)

```typescript
$: if (user) {
	setBreadcrumbs([
		{
			text: 'Users',
			href: `${PUBLIC_BASE_PATH}/users`
		},
		{
			text: user.name || user.email,
			href: `${PUBLIC_BASE_PATH}/users/${user.id}`
		}
	]);
}
```

### Special case (Response page with custom parent link)

```typescript
$: if (record && event) {
	setBreadcrumbs([
		{
			text: 'Responses',
			href: `${PUBLIC_BASE_PATH}/events/${event.id}/responses` // Links back to event responses
		},
		{
			text: record.serial
				? `${event.responsePrefix}${record.serial.toString().padStart(3, '0')}`
				: record.id,
			href: `${PUBLIC_BASE_PATH}/response/${record.id}`
		}
	]);
}
```

### Deeply nested route (New review page)

```typescript
$: if (event) {
	setBreadcrumbs([
		{
			text: 'Events',
			href: `${PUBLIC_BASE_PATH}/events`
		},
		{
			text: event.name,
			href: `${PUBLIC_BASE_PATH}/events/${event.id}`
		},
		{
			text: 'Reviews',
			href: `${PUBLIC_BASE_PATH}/events/${event.id}/reviews`
		},
		{
			text: 'New Review',
			href: `${PUBLIC_BASE_PATH}/events/${event.id}/reviews/new`
		}
	]);
}
```
