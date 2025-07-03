function generateCertificateContent(
  certNo,
  username,
  courseTitle,
  instructorName,
  hours,
  issuer = "Techtonic"
) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Certificate of Completion</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body {
        width:100%; height:100%;
        font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display:flex; align-items:center; justify-content:center;
        background:#f0f0f0;
      }
      .certificate {
        position:relative;
        width:800px; height:600px;
        border-radius:12px;
        overflow:hidden;
        box-shadow:0 8px 30px rgba(0,0,0,0.15);
      }
      .certificate img.bg {
        position:absolute;
        top:0; left:0;
        width:100%; height:100%;
        object-fit:cover;
        z-index:1;
      }
      .content {
        position:relative;
        z-index:2;
        height:100%; width:100%;
        padding:80px 100px;    /* generous padding */
        text-align:left;       /* left-align all text */
        color:#003470;
      }
      /* Main title split into two lines */
      h1.title {
        font-family:'Georgia', serif;
        font-size:3.5rem;
        line-height:1.1;
        margin-bottom:0.2em;
      }
      h1.title .small {
        display:block;
        font-size:1.5rem;
        margin-top:0.1em;
        color:#414a55;
      }
      h2.subtitle {
        font-size:1.2rem;
        font-style:italic;
        color:#414a55;
        margin-bottom:1em;
      }
      .recipient {
        font-size:2rem;
        font-weight:700;
        margin-bottom:0.5em;
      }
      .course {
        font-size:1.5rem;
        margin-bottom:0.5em;
      }
      .details {
        font-size:1rem;
        color:#414a55;
        margin-bottom:1.5em;
      }
      .issued {
        position:absolute;
        bottom:30px; left:50px;
        font-size:1rem;
        color:#003470;
      }
      .seal {
        position:absolute;
        bottom:20px; right:30px;
        width:90px; height:90px;
        background:radial-gradient(circle at center, #00bfff, #0066cc);
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:2.2rem;
        box-shadow:0 0 0 5px #fff, 0 0 0 8px rgba(0,0,0,0.1);
      }
    </style>
  </head>
  <body>
    <div class="certificate">
      <!-- background image -->
      <img
        class="bg"
        src="https://res.cloudinary.com/dn8nlt19v/image/upload/v1747941629/CertificateBGImage.jpg"
        alt="Certificate background"
      />
      <div class="content">
        <h1 class="title">
          Certificate
          <span class="small">of Completion</span>
        </h1>

        <h2 class="subtitle">This certificate is proudly presented to</h2>
        <div class="recipient">${username}</div>
        <div class="subtitle">for successfully completing</div>
        <div class="course">${courseTitle}</div>
        <div class="details">
          Duration: ${hours} hours | Instructor: ${instructorName}
        </div>

        <div class="issued">
          Issued by ${issuer} on ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
}

module.exports = generateCertificateContent;
//<div class="seal">🏅</div>
