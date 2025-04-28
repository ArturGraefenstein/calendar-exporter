import fs from 'node:fs';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { google } from 'googleapis';
import open from 'open';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

async function authorize() {
	const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);

	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});

	console.log('\n📎 Öffne folgenden Link im Browser:\n', authUrl);
	await open(authUrl);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question('\n🔐 Gib den Code aus der URL hier ein: ', async (code) => {
		rl.close();
		const { tokens } = await oAuth2Client.getToken(code);
		tokens.client_id = process.env.CLIENT_ID;
		tokens.client_secret = process.env.CLIENT_SECRET;

		execSync(`echo '${JSON.stringify(tokens)}' | wrangler secret put GOOGLE_TOKEN_JSON`, { stdio: 'inherit' });

		console.log(`\n✅ Tokens wurden in die secrets exportiert! Dein Token json:\n ${JSON.stringify(tokens)}`);
		process.exit(0);
	});
}

authorize();
