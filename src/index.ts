/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


import { google } from 'googleapis';
import type { calendar_v3, GaxiosPromise } from 'googleapis/build/src/apis/calendar';
import ical, { ICalEventStatus, ICalEventTransparency } from 'ical-generator';
import { CALENDAR_ID_MAP } from './calendar-config';

// links
// /ics/my_calender_key/my_secret_uuid

export default {
	async fetch(request, env, ctx): Promise<Response> {

		const token = JSON.parse(env.GOOGLE_TOKEN_JSON);
		const SECRET_UUID = env.SECRET_UUID;

		const url = new URL(request.url);
		const parts = url.pathname.split('/').filter(Boolean);

		// URL muss exakt /ics/SECRET_UUID sein
		if (parts.length !== 3 || parts[0] !== 'ics' || parts[2] !== SECRET_UUID) {
			return new Response('Unauthorized', { status: 401 });
		}

		const calenderUrlType = parts[1] as keyof typeof CALENDAR_ID_MAP;
		const calendarConfig = CALENDAR_ID_MAP[calenderUrlType]
		const calendarId = calendarConfig.id;
		const calendarName = calendarConfig.name;

		const auth = new google.auth.OAuth2(
			token.client_id,
			token.client_secret
		);
		auth.setCredentials(token);

		const calendar = google.calendar({ version: 'v3', auth });


		const now = new Date();
		const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
		const timeMax = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

		const events = [];
		let pageToken: string | null | undefined = undefined;

		try {
			do {
				const res = await (calendar.events.list({
					calendarId,
					timeMin: timeMin.toISOString(),
					timeMax: timeMax.toISOString(),
					maxResults: 2500,
					singleEvents: true,
					orderBy: 'startTime',
					pageToken,
					showDeleted: false,
				}) as GaxiosPromise<calendar_v3.Schema$Events>);

				events.push(...(res.data.items || []));
				pageToken = res.data.nextPageToken;
			} while (pageToken);
		} catch (e) {
			console.error('Error fetching events:', e);
		}


		// 📤 Kalender erstellen
		const cal = ical({ name: calendarName });

		for (const event of events) {
			if (!event.start || !event.end) continue;

			cal.createEvent({
				id: event.id,
				start: event.start.dateTime ?? event.start.date ?? new Date(),
				end: event.end.dateTime || event.end.date,
				summary: event.summary || 'Ohne Titel',
				description: generateDescription(event),
				location: event.location || '',
				url: event.htmlLink,
				status: event.status === "confirmed" ? ICalEventStatus.CONFIRMED : event.status === "tentative" ? ICalEventStatus.TENTATIVE : ICalEventStatus.CANCELLED, // confirmed, tentative, cancelled
				organizer: event.organizer?.email ? {
					name: event.organizer.displayName ?? "Unbekannt",
					email: event.organizer.email,
				} : undefined,
				created: event.created ? new Date(event.created) : undefined,
				lastModified: event.updated ? new Date(event.updated) : undefined,
				transparency: event.transparency === 'transparent' ? ICalEventTransparency.TRANSPARENT : ICalEventTransparency.OPAQUE,
			});
		}

		// 📨 Rückgabe
		return new Response(cal.toString(), {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': 'inline; filename="calendar.ics"',
			},
		});
	},
} satisfies ExportedHandler<Env>;;

// 🧾 Beschreibung zusammensetzen aus Notizen + Hangouts etc.
function generateDescription(event: calendar_v3.Schema$Event) {
	let desc = event.description || '';

	if (event.hangoutLink) {
		desc += `\n\nMeet-Link: ${event.hangoutLink}`;
	}

	// enable this if you want to show the video link
	// if (event.conferenceData?.entryPoints) {
	// 	for (const entry of event.conferenceData.entryPoints) {
	// 		if (entry.entryPointType === 'video') {
	// 			desc += `\nVideo-Link: ${entry.uri}`;
	// 		} else if (entry.entryPointType === 'phone') {
	// 			desc += `\nTelefon: ${entry.uri}`;
	// 		}
	// 	}
	// }

	return desc.trim();
}

// enable this if you want to use the reminders
// 🔔 Erinnerungen in iCal-Alarm-Format umwandeln
// function generateReminders(event: calendar_v3.Schema$Event) {
// 	if (!event.reminders || !event.reminders.useDefault) return [];

// 	if (Array.isArray(event.reminders.overrides)) {
// 		return event.reminders.overrides.filter(r => r.minutes != null).map(r => ({
// 			type: 'display',
// 			trigger: -(r.minutes ?? 0) * 60, // Sekunden vor Event
// 		}));
// 	}

// 	return [];
// }