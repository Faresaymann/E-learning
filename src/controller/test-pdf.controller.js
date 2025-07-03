const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const { v4: uuid } = require("uuid");
const { success } = require("../utils/response/response");
const cloudinary = require("cloudinary").v2;

// make sure you’ve already done this once at app startup:
// cloudinary.config({ cloud_name, api_key, api_secret });

exports.generateTestPDF = asyncHandler(async (req, res) => {
  const testId = uuid();

  // 1) Create the PDFDocument
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // 2) Kick off Cloudinary upload and pipe the PDF stream
  const uploadResultPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: testId,
        folder: "test-pdf",
        resource_type: "raw",
        overwrite: true,
        format: "pdf",
        access_mode: "public",
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    doc.pipe(uploadStream);
  });

  // 3) Write all your PDF content *after* piping
  doc
    .fontSize(25)
    .fillColor("blue")
    .text("Test PDF Document", { align: "center" })
    .moveDown();
  doc
    .fontSize(16)
    .fillColor("black")
    .text(`Generated at ${new Date().toISOString()}`, { align: "center" })
    .moveDown();
  doc.rect(100, 300, 400, 100).fillAndStroke("#f0f0f0", "#999");
  doc
    .fontSize(14)
    .fillColor("#333")
    .text("If you see this, PDF streaming works!", 150, 340);

  // 4) Finalize the PDF—this actually flushes all the bytes through the pipe
  doc.end();

  // 5) Now await the upload result
  const uploadResult = await uploadResultPromise;

  // 6) Build an inline-view URL by injecting fl_attachment:false
  const inlineUrl = uploadResult.secure_url.replace(
    "/upload/",
    "/upload/fl_attachment:false/"
  );

  // 7) Send response with the inline URL
  const { statusCode, body } = success({
    message: "PDF generated & uploaded",
    data: {
      pdfUrl: inlineUrl,
      documentId: testId,
    },
  });
  res.status(statusCode).json(body);
});
