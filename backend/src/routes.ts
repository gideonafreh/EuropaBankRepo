import {Router} from "express";
import multer from "multer";
import {
    uploadDocumentController,
    signDocumentController,
    downloadPackageController
    // sendForSigning,
    // testAuth,
} from "./signinghub";

const router = Router();
const upload = multer({storage: multer.memoryStorage()});

router.post("/upload", upload.single("file"), uploadDocumentController);
router.post("/sign", signDocumentController);
router.get(
    "/download/:packageId",
    downloadPackageController
);


// router.post("/sign", sendForSigning);
// router.get("/auth-test", testAuth);

export default router;
