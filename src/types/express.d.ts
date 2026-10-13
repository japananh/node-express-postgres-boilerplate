import type { Client } from 'pg';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			postgres: Client;
			// Set by express-jwt (requestProperty: 'user').
			user?: { userId: number; roleId: number };
		}
	}
}
