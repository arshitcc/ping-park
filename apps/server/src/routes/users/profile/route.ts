import { Router } from "express";
import { validate } from "@/middlewares/validator.middleware";
import { imageSchema, updateProfileSchema } from "@/validators/users/profile";
import { changeAvatar, updateUserProfile } from "./controller";
import { isLoggedIn } from "@/middlewares/auth.middleware";

const router = Router();

router.use(isLoggedIn);

router.route("/update-avatar").post(validate(imageSchema), changeAvatar);
// router.route("/get-avatar-upload-signature").get();
router
  .route("/update-profile")
  .patch(validate(updateProfileSchema), updateUserProfile);

export default router;
