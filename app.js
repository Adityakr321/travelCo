const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config({ path: __dirname + '/.env' });


const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

console.log("MONGODB_URI:", process.env.MONGODB_URI);

// MongoDB Atlas connection with options for stability
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
  console.log("Successfully connected to MongoDB Atlas!");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

const contactSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Email: { type: String, required: true },
    Phone: { type: String, required: true },
    Message: { type: String, required: true }
});
const Contact = mongoose.model('Contact', contactSchema);


const registerSchema = new mongoose.Schema({
    Name: { type: String, required: true },
    Email: { type: String, required: true, unique: true },
    Phone: { type: String, required: true },
    preferredDestination: { type: String },
    numberOfAdults: { type: Number },
    numberOfChildren: { type: Number },
    SpecialRequests: { type: String }
});
const Registration = mongoose.model('Registration', registerSchema);


app.get("/home",function(req,res){
    res.render("home");
})

app.get("/registration",function(req,res){
    res.render("registration");
})

app.get("/contact",function(req,res){
    res.render("contact");
})

// Route to display all registrations
app.get("/registrations", (req, res) => {
    Registration.find({})
        .then(registrations => {
            res.render("registrations", { registrationsList: registrations });
        })
        .catch(err => {
            res.status(500).send("Error retrieving registration data: " + err.message);
        });
});



app.get("/thankyou",function(req,res){
    res.render("thankyou");
})

app.get("/search-registration", (req, res) => {
    const email = req.query.email;

    // Search for the registration by email
    Registration.findOne({ Email: email })
        .then(registration => {
            if (registration) {
                // If registration is found, render the registration details page
                res.render("registrations", { registrationsList: [registration] });
            } else {
                // If no registration is found, display a message
                res.status(404).send("No registration found with that email.");
            }
        })
        .catch(err => {
            console.error("Error retrieving registration:", err);
            res.status(500).send("Error retrieving registration.");
        });
});

// Registration POST Route
app.post('/home', (req, res) => {
    const { name, email, phone, destination, adults, children, specialRequests } = req.body;

    // Ensure all required fields are filled
    if (!email || !name || !phone) {
        return res.status(400).send('Name, email, and phone are required.');
    }

    const newRegistration = new Registration({
        Name: name,
        Email: email,
        Phone: phone,
        preferredDestination: destination,
        numberOfAdults: adults,
        numberOfChildren: children,
        SpecialRequests: specialRequests
    });

    newRegistration.save()
        .then(() => res.redirect("/home"))
        .catch(err => {
            console.error('Error saving registration:', err);

            if (err.code === 11000) {
                res.status(400).send('Duplicate email error. This email is already registered.');
            } else {
                res.status(500).send('An error occurred during registration.');
            }
        });
});



// Contact POST Route
app.post('/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Validate that all fields are provided
    if (!name || !email || !phone || !message) {
        return res.status(400).send('All fields are required.');
    }

    const newContact = new Contact({
        Name: name,
        Email: email,
        Phone: phone,
        Message: message
    });

    newContact.save()
        .then(() => {
            // Redirect to thank you page if save is successful
            res.redirect("/thankyou");
        })
        .catch((err) => {
            console.error('Error saving contact:', err);

            if (err.code === 11000) {
                res.status(400).send('Duplicate email error. This email is already in use.');
            } else {
                res.status(500).send('Contact form submission failed.');
            }
        });
});



app.listen(3000,function(req,res){
    console.log("Server is running on port 3000");
})