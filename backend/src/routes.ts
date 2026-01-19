import { Router } from "express";
import multer from "multer";
import {
    uploadDocumentController,
    getIframeController,
    downloadPackageController,
} from "./signinghub";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadDocumentController);
router.post("/iframe", getIframeController);
router.get("/download/:packageId", downloadPackageController);

export default router;
