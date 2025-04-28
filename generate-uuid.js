import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

async function generateUUID() {
	const uuid = randomUUID();

	execSync(`echo '${uuid}' | wrangler secret put SECRET_UUID`, { stdio: 'inherit' });
	console.log(`\n✅ UUID wurde in die secrets exportiert! Bitte notiere sie: ${uuid}\n`);
	process.exit(0);
}

generateUUID();
