const express = require('express');
const validate = require('../../middlewares/validate');
const { roleValidation } = require('../../validations');
const { roleController } = require('../../controllers');

const { grantAccess } = require('../../middlewares/validateAccessControl');
const { resources } = require('../../config/roles');

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
		validate(roleValidation.updateUser),
		roleController.updateRole
	)
	.delete(
		grantAccess('deleteAny', resources.ROLE),
		validate(roleValidation.deleteRole),
		roleController.deleteRole
	);

module.exports = router;

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
 *        "400":
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
 *          description: sort by query in the form of field:desc/asc (ex. name:asc)
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
 *        "400":
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
