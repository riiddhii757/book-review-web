// Import required modules
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config(); // Load DB credentials from .env file

// Create an Express app
const app = express();

// Set the port for the app to run
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // For parsing form data
app.use(bodyParser.json()); // For parsing JSON bodies
// In index.js, add this line to serve static files
app.use(express.static('public'));


// Set view engine to EJS
app.set("view engine", "ejs");

// Create a connection pool for PostgreSQL using the credentials you provided
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Home route to display reviews
app.get("/", async (req, res) => {
    try {
      // Fetch reviews from the database and render them on the home page
      const result = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
      res.render("index", { reviews: result.rows }); // Pass reviews to EJS template
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

// Route to handle new review submission
app.post("/reviews", async (req, res) => {
    const { title, author, review, rating } = req.body;
  
    if (!title || !author || !review || !rating) {
      return res.status(400).send("All fields are required.");
    }
  
    try {
      await pool.query(
        "INSERT INTO reviews (title, author, review, rating) VALUES ($1, $2, $3, $4)",
        [title, author, review, rating]
      );
      res.redirect("/"); // Redirect to homepage after review is added
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });
 
  app.get("/reviews/edit/:id", async (req, res) => {
    const reviewId = req.params.id;
    try {
        const result = await pool.query("SELECT * FROM reviews WHERE id = $1", [reviewId]);
        if (result.rows.length === 0) {
            return res.status(404).send("Review not found");
        }
        // Render the edit page with the current review data
        res.render("edit", { review: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


app.post("/reviews/edit/:id", async (req, res) => {
    const reviewId = req.params.id;
    const { title, author, review, rating } = req.body;
    try {
        // Update review with new values
        await pool.query(
            "UPDATE reviews SET title = $1, author = $2, review = $3, rating = $4 WHERE id = $5",
            [title, author, review, rating, reviewId]
        );
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


app.post("/reviews/delete/:id", async (req, res) => {
    const reviewId = req.params.id;
    try {
        // Delete the review from the database
        await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


  

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});