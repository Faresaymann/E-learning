# TechTonic Backend - E-Learning Platform

<img src="Assets/Logo/logo.png" alt="TechTonic Logo" width="200" />

---

## 🚀 About TechTonic Backend

This is the backend API for TechTonic, a modern e-learning platform built with Node.js and Express. It handles user authentication, course management, certificate generation, and secure transactions. The backend interacts with a MongoDB database and integrates Cloudinary for media storage.

---

## 🛠️ Features

- User Registration & Login (Email-based)
- Course & Lesson Management
- Progress Tracking
- Certificate Generation (PDF + Email)
- Coupon & Transaction Handling
- RESTful API Architecture
- Cloudinary Integration for Media
- JWT-based Authentication

---

## 🏗️ Tech Stack

- **Backend:** Node.js (Express)
- **Database:** MongoDB (local or Atlas)
- **Media Storage:** Cloudinary
- **Auth:** JWT
- **Email:** Nodemailer (optional)

---

## 🔧 Getting Started

### Prerequisites

- Git
- Node.js v14 or later
- npm
- MongoDB (local or Atlas)
- Cloudinary account (for media upload)

### Optional Tools

- Postman or Insomnia (API testing)
- VS Code (recommended editor)

---

## Installation

### Clone & Setup
```bash 
# 1. Clone the backend repo
git clone https://github.com/Faresaymann/E-learning.git MyCustomFolder
# This creates a folder named `MyCustomFolder/`
```

### Setup Backend

#### Windows (PowerShell)
```bash
cd backend
npm install
Copy-Item .env.example .env
# Edit .env with Notepad or VS Code
notepad .env
npm run dev
```

#### macOS / Linux
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
nano .env
npm run dev
```

---
## Configuration 
  Your .env file (located in /backend) must include the following variables:
```bash
# MongoDB connection
MONGO_URI=mongodb://localhost:27017/techtonic

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# (optional) Server port
PORT=3000
```
---

## 📚 Documentation
 Full documentation is available at our [GitBook site](https://faresayman.gitbook.io/techtonic/).


---

## 🤝 Contributing
 Contributions are welcome! Please fork the repo, create a feature branch, and submit a pull request.

---

## 📄 License
 This project is licensed under the MIT License.

---

## 📞 Contact
 For questions or support, reach out to faressaymann@gmail.com.


