import path from 'path';
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerDefinition from '../../docs/swaggerDef';

const router = express.Router();

// Relative to this file so it resolves from both src/ (tsx, ts-jest) and dist/.
const srcRoot = path.join(__dirname, '../..');
const specs = swaggerJsdoc({
	swaggerDefinition,
	apis: [
		path.join(srcRoot, 'docs/*.yml'),
		path.join(srcRoot, 'routes/v1/*.{ts,js}'),
	],
});

router.use('/', swaggerUi.serve);

router.get(
	'/',
	swaggerUi.setup(specs, {
		explorer: true,
	})
);

export default router;
