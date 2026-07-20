import { describe, expect, it } from 'vitest';
import { formatActivityTime, parseActivityTime, serializeActivityTime } from './activity-time';

describe('activity time conversion', () => {
	it('parses midnight and noon into 12-hour parts', () => {
		expect(parseActivityTime('00:30')).toEqual({ hour: '12', minute: '30', period: 'AM' });
		expect(parseActivityTime('12:30')).toEqual({ hour: '12', minute: '30', period: 'PM' });
	});

	it('parses afternoon values without changing the minute', () => {
		expect(parseActivityTime('18:35')).toEqual({ hour: '6', minute: '35', period: 'PM' });
	});

	it('serializes 12-hour selections as HH:mm values', () => {
		expect(serializeActivityTime('12', '00', 'AM')).toBe('00:00');
		expect(serializeActivityTime('12', '00', 'PM')).toBe('12:00');
		expect(serializeActivityTime('6', '30', 'PM')).toBe('18:30');
		expect(serializeActivityTime('1', '59', 'AM')).toBe('01:59');
	});

	it('rejects invalid stored or selected values', () => {
		expect(parseActivityTime('24:00')).toBeUndefined();
		expect(parseActivityTime('18:60')).toBeUndefined();
		expect(serializeActivityTime('13', '00', 'AM')).toBeUndefined();
		expect(serializeActivityTime('1', '60', 'PM')).toBeUndefined();
	});

	it('formats valid times for the applicant summary and preserves malformed values', () => {
		expect(formatActivityTime('00:05')).toBe('12:05 AM');
		expect(formatActivityTime('18:30')).toBe('6:30 PM');
		expect(formatActivityTime('unknown')).toBe('unknown');
	});
});
