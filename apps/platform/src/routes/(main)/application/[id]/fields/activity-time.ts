export type ActivityTimePeriod = 'AM' | 'PM';

export type ActivityTimeParts = {
	hour: string;
	minute: string;
	period: ActivityTimePeriod;
};

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const parseActivityTime = (value: string): ActivityTimeParts | undefined => {
	const match = timePattern.exec(value);
	if (!match) return undefined;

	const hour24 = Number(match[1]);
	return {
		hour: String(hour24 % 12 || 12),
		minute: match[2],
		period: hour24 >= 12 ? 'PM' : 'AM'
	};
};

export const serializeActivityTime = (
	hour: string,
	minute: string,
	period: ActivityTimePeriod
): string | undefined => {
	const hour12 = Number(hour);
	const minuteNumber = Number(minute);

	if (
		!Number.isInteger(hour12) ||
		hour12 < 1 ||
		hour12 > 12 ||
		!Number.isInteger(minuteNumber) ||
		minuteNumber < 0 ||
		minuteNumber > 59
	) {
		return undefined;
	}

	const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0);
	return `${String(hour24).padStart(2, '0')}:${String(minuteNumber).padStart(2, '0')}`;
};

export const formatActivityTime = (value: string): string => {
	const parts = parseActivityTime(value);
	return parts ? `${parts.hour}:${parts.minute} ${parts.period}` : value;
};
