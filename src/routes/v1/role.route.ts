import express from 'express';
import validate from '../../middlewares/validate';
import { roleValidation } from '../../validations';
import { roleController } from '../../controllers';

import { grantAccess } from '../../middlewares/validateAccessControl';
import { resources } from '../../config/roles';

const router = express.Router();

router
	.route('/')
	.get(
		grantAccess('readAny', resources.ROLE),
		validate(roleValidation.getRoles),
		roleController.getRoles
	)
	.post(
		grantAccess('createAny', resources.ROLE),
		validate(roleValidation.createRole),
		roleController.createRole
	);

router
	.route('/:roleId')
	.get(
		grantAccess('readAny', resources.ROLE),
		validate(roleValidation.getRole),
		roleController.getRole
	)
	.patch(
		grantAccess('updateAny', resources.ROLE),
		validate(roleValidation.updateRole),
		roleController.updateRole
	)
	.delete(
		grantAccess('deleteAny', resources.ROLE),
		validate(roleValidation.deleteRole),
		roleController.deleteRole
	);

export default router;

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management and retrieval
 */

/**
 * @swagger
 * /roles:
 *    post:
 *      summary: Create a role
 *      description: Only admins can create roles.
 *      tags: [Roles]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - name
 *                - description
 *              properties:
 *                name:
 *                  type: string
 *                  description: must be unique
 *                description:
 *                   type: string
 *              example:
 *                name: admin
 *                description: admin
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Role'
 *        "409":
 *          $ref: '#/components/responses/DuplicateRole'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *
 *    get:
 *      summary: Get all users' roles
 *      description: Only admins can retrieve all roles.
 *      tags: [Roles]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: query
 *          name: name
 *          schema:
 *            type: string
 *          description: role name
 *        - in: query
 *          name: description
 *          schema:
 *            type: string
 *          description: role descrition
 *        - in: query
 *          name: sortBy
 *          schema:
 *            type: string
 *            pattern: '^(id|name|description|created_date_time|modified_date_time):(asc|desc)$'
 *            example: name:asc
 *          description: Sort by one field, as field:asc or field:desc. Allowed fields are id, name, description, created_date_time and modified_date_time. Ties are broken by id ascending. Without it, roles are ordered by name asc, created_date_time desc, modified_date_time desc. An invalid value answers 400.
 *        - in: query
 *          name: limit
 *          schema:
 *            type: integer
 *            minimum: 1
 *          default: 10
 *          description: Maximum number of users
 *        - in: query
 *          name: page
 *          schema:
 *            type: integer
 *            minimum: 1
 *            default: 1
 *          description: Page number
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  results:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Role'
 *                  page:
 *                    type: integer
 *                    example: 1
 *                  limit:
 *                    type: integer
 *                    example: 10
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /roles/{id}:
 *    get:
 *      summary: Get a user's role
 *      description: Only admins can fetch other roles
 *      tags: [Roles]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Role id
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Role'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    patch:
 *      summary: Update a user's role
 *      description: Only admins can update other users' roles.
 *      tags: [Roles]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Role id
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                description:
 *                  type: string
 *                  description: can be empty
 *      responses:
 *        "200":
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#/components/schemas/Role'
 *        "409":
 *          $ref: '#/components/responses/DuplicateRole'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 *
 *    delete:
 *      summary: Delete a user's role
 *      description: Only admins can delete roles.
 *      tags: [Roles]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *          description: Role id
 *      responses:
 *        "200":
 *          description: No content
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 *        "404":
 *          $ref: '#/components/responses/NotFound'
 */
