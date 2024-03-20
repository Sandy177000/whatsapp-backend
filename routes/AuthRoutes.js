import {Router} from "express";
import { checkUser, generateToken, getAllUsers, logoutUser, onBoardUser } from "../controllers/AuthController.js";
import protectRoute from "../middlewares/protectRoutes.js";
const router = Router();


router.post('/check-user',checkUser)
.post('/onboard-user', onBoardUser)
.get('/get-contacts', protectRoute,getAllUsers)
.get('/generate-token/:userId', generateToken)
.post('/logout', logoutUser)



export default router;