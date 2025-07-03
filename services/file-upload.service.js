const multer = require("multer");
const { v4: uuid } = require("uuid");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const { validationError } = require("../utils/response/errors");

const storage = multer.memoryStorage();

const filter = function (req, file, cb) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "video/mp4",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/octet-stream",
  ];

  // Check if the file type is allowed
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Reject file with an error message
    cb(
      validationError({
        message:
          "Invalid file type. Only JPEG, JPG, PNG, MP4, PDF, and PPT files are allowed.",
      }),
      false
    );
  }
};

const upload = multer({ storage: storage, fileFilter: filter });

exports.uploadSingle = (fieldname) => upload.single(fieldname);

exports.uploadMix = (arrayOfFields) => upload.fields(arrayOfFields);

exports.uploadToCloudinary = async (fileBuffer, filename, folder = "") => {
  return await new Promise((resolve) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: filename,
          folder: folder,
          resource_type: "auto",
        },
        (err, uploadResult) => {
          return resolve(uploadResult);
        }
      )
      .end(fileBuffer);
  });
};

/**
 * Uploads a PDF certificate to Cloudinary with proper encoding
 * @param {Buffer} pdfBuffer - The PDF file as a buffer
 * @param {string} folder - The folder to upload to in Cloudinary
 * @param {string} userId - User ID for folder structure
 * @param {string} courseId - Course ID for folder structure
 * @returns {Promise<Object>} - Cloudinary upload result
 */
exports.uploadCertificateToCloudinary = (pdfBuffer, folder = "", userId, courseId) => {
  const publicId = uuid();
  const folderPath = [folder, userId, courseId].filter(Boolean).join("/");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: folderPath,
        resource_type: "raw",
        overwrite: true,
        access_mode: "public",
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  });
};

exports.uploadFilesToCloudinary = async (fileBuffer, folder = "") => {
  return await new Promise((resolve) => {
    const pk = `module-${uuid()}-${Date.now()}`;
    const pkk = pk.substring(0, 10);
    console.log("pkk,", pkk);
    cloudinary.uploader
      .upload_stream(
        {
          public_id: pkk,
          folder: folder,
          resource_type: "auto",
        },
        (err, uploadResult) => {
          return resolve(uploadResult);
        }
      )
      .end(fileBuffer);
  });
};

exports.uploadVideoToCloudinary = async (fileBuffer, folder = "") => {
  return await new Promise((resolve) => {
    const pk = `video-${uuid()}-${Date.now()}`;
    const pkk = pk.substring(0, 10);
    console.log("pkk,", pkk);
    cloudinary.uploader
      .upload_stream(
        {
          public_id: pkk,
          folder: folder,
          resource_type: "video",
        },
        (err, uploadResult) => {
          return resolve(uploadResult);
        }
      )
      .end(fileBuffer);
  });
};

exports.uploadImageToCloudinary = async (fileBuffer, folder = "") => {
  return await new Promise((resolve) => {
    const pk = `image-${uuid()}-${Date.now()}`;
    const pkk = pk.substring(0, 10);
    console.log("pkk,", pkk);
    cloudinary.uploader
      .upload_stream(
        {
          public_id: pkk,
          folder: folder,
          resource_type: "image",
        },
        (err, uploadResult) => {
          return resolve(uploadResult);
        }
      )
      .end(fileBuffer);
  });
};