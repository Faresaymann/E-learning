
function generateCertificateContent(certNo,username, courseTitle,instructorName,hours) {
  // Use a template literal for readability and flexibility
  return `
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Easy Learning Certificate</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f7f7f7;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        /* Ensures certificate fills viewport */
      }
  
      .certificate {
        width: 700px;
        /* Adjusted width for better scaling */
        padding: 50px;
        border-radius: 10px;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        position: relative;
        /* Needed for certificate number placement */
      }
  
      h1,
      h2 {
        margin: 10px 0;
      }
  
      .logo {
        width: 120px;
        margin: 0 auto 20px auto;
      }
  
      .user-details,
      .course-title {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        /* Consistent text color */
      }
  
      .course-title {
        margin-bottom: 15px;
      }
  
      .certificate-number {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 10px;
        /* Reduced font size for certificate number */
        color: #999;
        text-align: right;
        white-space: normal;
        /* Allow text to wrap */
        overflow: hidden;
        /* Hides overflowing text with ellipsis (...) */
        text-overflow: ellipsis;
        /* Adds ellipsis (...) for overflowing text */
        max-width: 200px;
        /* Maximum width for certificate number container */
        max-height: 40px;
        /* Maximum height for two lines of text */
        line-height: 10px;
        /* Line height for better vertical alignment */
      }
  
      .issued-by {
        font-size: 12px;
        text-align: right;
        margin-top: 20px;
      }
  
      .green-text {
        color: #006600;
        /* Green color for specific elements */
      }
  
      .certificate h1 {
        font-size: 32px;
        /* Slight increase in heading size */
      }
  
      .certificate h2 {
        font-size: 18px;
        /* Reduced heading size for better hierarchy */
      }
  
      .course-length {
        font-style: italic;
        font-size: 14px;
        margin-bottom: 10px;
      }
    </style>
  </head>
  
  <body>
    <div class="certificate">
      <p class="certificate-number">Certificate Number:${certNo} </p>
      <img
        src="https://res.cloudinary.com/djcwvsuw1/image/upload/v1715429915/course/user-1f9dbc44-9639-4b32-95da-67b178dd133f-1715429913680.jpeg.jpg"
        alt="Easy Learning Logo" class="logo">
      <h1>Certificate of Completion</h1>
      <h2>This certificate is awarded to</h2>
      <p class="user-details">${username}</p>
      <h2>for successfully completing the course</h2>
      <p class="course-title">${courseTitle}</p>
      <p class="course-length">(${hours} hours)</p>
      <p>Instructed by: ${instructorName}</p>
      <p>Date Issued: ${new Date().toLocaleDateString()}</p>
      <p class="issued-by">Issued by E-Learning</p>
    </div>
  </body>
  
  </html>
  `;
}

module.exports = generateCertificateContent;