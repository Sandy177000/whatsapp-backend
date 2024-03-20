import {Router} from "express";
import { addAudioMessage, addImageMessage, addMessage, getInitialContactswithMessages, getMessages, getMessages1 } from "../controllers/MessageController.js";
import multer from 'multer';
import protectRoute from "../middlewares/protectRoutes.js";

const router = Router();

// Note: multer middleware to upload the files sent via the request as a form-data object of Content-type = mult
const uploadImage = multer({dest:"uploads/images/"})
const uploadAudio = multer({dest:"uploads/recordings/"})

router
.post('/add-message',addMessage)

// .get('/get-messages/:from/:to',getMessages)  // used post instead

.post('/get-messages',protectRoute,getMessages1) 
.post('/add-image-message',uploadImage.single("image"),addImageMessage)
.post('/add-audio-message',uploadAudio.single("audio"),addAudioMessage)
.get('/get-initial-contacts/:from',protectRoute, getInitialContactswithMessages)

export default router;


//  TODO
//  .get('/get-messages/:from/:to',getMessages) secure this endpoint, add middleware to check if request is made by actual-client and not any other
// another solution is to use post method instead

