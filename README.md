## TechTonic E-Learning Backend

This repository contains the **backend** for the TechTonic E-Learning platform, built using **Node.js** and **MongoDB**. The system provides user authentication, course enrollment, and progress tracking. It supports premium membership with additional benefits (e.g., discounts on selected courses).

## Installation

**Clone the Repository**:

   ```bash
   git clone https://github.com/YourUsername/TechTonic-Elearning-Backend.git
   cd TechTonic-Elearning-Backend
```

## Features

    User Authentication:
        Users can sign up and log in using email and password.
        Authentication is handled via JSON Web Tokens (JWT).
    Course Management:
      Create, Read, Update, Delete (CRUD) operations for courses.
      Course data is stored in MongoDB (e.g., within the courses collection).
      
    Enrollment & Progress Tracking:
      Users can enroll in courses.
      Track course progress, such as completed lessons and quizzes.

    Premium Membership
      Premium members enjoy benefits like:
      Discounts on select courses.
      Access to exclusive content.

    Persistence
      All data (users, courses, enrollments) is stored in MongoDB.
      A flexible schema allows for easy scaling and modifications.

## How to Run Locally
    Ensure MongoDB is running locally or have access to a MongoDB Atlas instance.
    Start the server with:
    
 ``` bash
 npm run dev
 ```
      (assuming you have a dev script configured with tools like nodemon).

      Test the API:
       Use a tool like Postman or cURL to test endpoints:
          Sign Up: POST /api/auth/signup
          Log In: POST /api/auth/login
          View Courses: GET /api/courses
          Enroll: POST /api/enrollments
    
## File Structure
    A possible file structure:
    
    TechTonic-Elearning-Backend/
    ├── controllers/
    │   ├── authController.js
    │   └── courseController.js
    ├── models/
    │   ├── User.js
    │   └── Course.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── courseRoutes.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── .env
    ├── app.js
    ├── package.json
    └── README.md

    controllers/: Request and response handling logic.
    models/: Mongoose schemas and models. 
    routes/: API route definitions (e.g., /api/auth, /api/courses). 
    middleware/: Custom middleware for authentication and error handling. 
    app.js: The main entry point that sets up Express and connects to MongoDB.

## Example Output
    When the server runs, you might see logs like:   
``` bash
[SERVER] listening on port: 3000
[DATABASE] connection established
```
Example JSON response for the POST /api/auth/signup endpoint:
 ``` bash
        {
      "message": "User registered successfully!",
      "user": {
        "_id": "60d21b4667d0d8992e610c85",
        "email": "user@example.com",
        "isPremium": false
      }
    }
```
## Future Improvements
    Admin Panel: A dedicated interface for managing users, courses, and enrollments.
    Payment Gateway Integration: Secure course payment processing (using Stripe, PayPal, etc.).  
    Enhanced Analytics: Monitor user progress, course popularity, and more. 
    Microservices Architecture: Consider splitting the application into separate services for better scalability.

## License

This project is open-source and available. Feel free to use and modify it according to your needs.
