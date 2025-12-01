import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../../utils/api-error";

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

class CloudinaryService {
  static generateSignature = (folder: string) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    };
  };

  static getFile = async (publicID: string) => {
    try {
      const res = await cloudinary.api.resource(publicID);
      if (!res) {
        throw new ApiError(404, "Something went wrong. Please try again later");
      }
      const { public_id, resource_type, format, url } = res;
      return { public_id, resource_type, format, url };
    } catch (error) {
      console.error(error);
      throw new ApiError(500, "Something went wrong. Please try again later");
    }
  };

  static getFiles = async (publicIDs: string[]) => {
    try {
      const res = await cloudinary.api.resources_by_ids(publicIDs);
      if (!res) {
        throw new ApiError(404, "Something went wrong. Please try again later");
      }
      const assets = res.resources.map(
        ({ public_id, resource_type, format, url }) => ({
          public_id,
          resource_type,
          format,
          url,
        })
      );
      return assets;
    } catch (error) {
      console.error(error);
      throw new ApiError(500, "Something went wrong. Please try again later");
    }
  };

  static deleteFile = async (publicID: string) => {
    try {
      await cloudinary.uploader.destroy(publicID);
      return true;
    } catch (error) {
      console.error(error);
      throw new ApiError(
        500,
        "Something went wrong while deleting file. Please try again later"
      );
    }
  };

  static deleteFiles = async (publicIDs: string[]) => {
    try {
      await cloudinary.api.delete_resources(publicIDs);
      return true;
    } catch (error) {
      console.error(error);
      throw new ApiError(
        500,
        "Something went wrong while deleting file. Please try again later"
      );
    }
  };
}

export default CloudinaryService;
