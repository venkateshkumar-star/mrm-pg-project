import { Router } from "express";
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  addElectricityCharge,
  getRoomElectricityCharges,
  getPgElectricityCharges,
} from "../controllers/roomController";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation";
import { authenticateAdmin, authorizeAdmin } from "../middlewares/auth";
import {
  createRoomSchema,
  updateRoomSchema,
  addElectricityChargeSchema,
  electricityChargesQuerySchema,
  pgElectricityChargesQuerySchema,
  pgIdParamSchema,
  roomIdParamSchema,
  pgIdAndRoomIdParamSchema,
  locationParamSchema,
  roomFilterQuerySchema,
} from "../validations/roomValidation";

const router = Router();

// All routes require authentication and authorization
router.use(authenticateAdmin);
router.use(authorizeAdmin);

// GET all rooms - defaults to first PG if no pgId provided
router.get("/", validateQuery(roomFilterQuerySchema), getRooms);

// GET /rooms/:pgId - Get all rooms of a specific PG
router.get("/:pgId", validateParams(pgIdParamSchema), validateQuery(roomFilterQuerySchema), getRooms);

// GET /rooms/:roomId - Get a specific room by ID
router.get("/:roomId", validateParams(roomIdParamSchema), getRoomById);

// POST /rooms/:pgId - Create a new room in a specific PG
router.post("/:pgId", validateParams(pgIdParamSchema), validateBody(createRoomSchema), createRoom);

// PUT /rooms/:roomId - Update a specific room
router.put("/:roomId", validateParams(roomIdParamSchema), validateBody(updateRoomSchema), updateRoom);

// DELETE /rooms/:roomId - Delete a specific room
router.delete("/:roomId", validateParams(roomIdParamSchema), deleteRoom);

// POST /rooms/:roomId/electricity-charge - Add electricity charge to a specific room
router.post("/:roomId/eb-charge", validateParams(roomIdParamSchema), validateBody(addElectricityChargeSchema), addElectricityCharge);

// GET /rooms/:roomId/electricity-charges - Get electricity charges for a specific room
router.get("/:roomId/eb-charges", validateParams(roomIdParamSchema), validateQuery(electricityChargesQuerySchema), getRoomElectricityCharges);

// GET /rooms/pg/:pgId/electricity-charges - Get electricity charges for all rooms in a specific PG
router.get("/pg/:pgId/eb-charges", validateParams(pgIdParamSchema), validateQuery(pgElectricityChargesQuerySchema), getPgElectricityCharges);

export default router;
