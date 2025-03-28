const multer = require("multer");
const { v4: uuid } = require("uuid");
const cloudinary = require("../config/cloudinary");

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
    'application/octet-stream'
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

exports.uploadCertificateToCloudnary = async (fileBuffer, filename, folder = "") => {
  try {
    const uploadResult = await cloudinary.uploader.upload_stream({
      public_id: filename,
      folder: folder,
      resource_type: "auto",
    }).then((result) => result).catch((error) => {
      throw new Error(`Cloudinary upload failed: ${error.message}`); // Handle Cloudinary errors
    });
    return uploadResult;
  } catch (error) {
    console.error(`Error uploading certificate: ${error.message}`);
    throw error; // Re-throw the error for proper handling
  }
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

exports.uploadCertificateToCloudinary = async (fileBuffer, folder = "", userId, courseId) => {
  return await new Promise((resolve) => {
    const pk = `cert-${uuid()}-${userId}-${courseId}-${Date.now()}`;

    cloudinary.uploader
      .upload_stream(
        {
          public_id: pk,
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

