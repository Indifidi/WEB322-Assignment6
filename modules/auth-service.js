const mongoose = require ('mongoose')
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Define the user schema
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [{
        dateTime: {
            type: Date,
            required: true
        },
        userAgent: {
            type: String,
            required: true
        }
    }]
});

let User; // to be defined on new connection (see initialize)

function initialize (){

    return new Promise ((resolve, reject)=> {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            reject(err); // reject the promise with an error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           console.log("User model defined");

           //unique index is created
           User.createIndexes()
               .then(() => {
                   console.log("User indexes created");
                   resolve();
               })
               .catch((err) => {
                   console.error("Error creating indexes:", err);
                   resolve(); // Still resolve as the model is created
               });
        });
    });
}

function registerUser (userData){
     return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }

        // if user already exists
        User.findOne({ userName: userData.userName })
            .then((existingUser) => {
                if (existingUser) {
                    reject("User Name already taken");
                    return;
                }

                // Hash the password using bcrypt
                return bcrypt.hash(userData.password, 10);
            })
            .then(hash => {
                // Replace the password with the hashed version
                userData.password = hash;
                
                // Create new user from userData
                let newUser = new User(userData);
                
                // Save the user to database
                return newUser.save();
            })
            .then(() => {
                resolve();
            })
            .catch((err) => {
                if (err.code === 11000) {
                    reject("User Name already taken");
                } else {
                    reject("There was an error creating the user: " + err);
                }
            });
    });
}

function checkUser (userData){
    return new Promise ((resolve, reject) => {
         User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                    return;
                }

                // Compare the entered password with the hashed password from database
                bcrypt.compare(userData.password, users[0].password)
                    .then((result) => {
                        if (!result) {
                            reject("Incorrect Password for user: " + userData.userName);
                            return;
                        }

                        // Check if there are 8 login history items and pop the last one if needed
                        if (users[0].loginHistory.length == 8) {
                            users[0].loginHistory.pop();
                        }

                        // Add new login entry to the front of the array
                        users[0].loginHistory.unshift({
                            dateTime: (new Date()).toString(),
                            userAgent: userData.userAgent
                        });

                        // Update the user's login history in the database
                        return User.updateOne(
                            { userName: users[0].userName },
                            { $set: { loginHistory: users[0].loginHistory } }
                        );
                    })
                    .then(() => {
                        resolve(users[0]);
                    })
                    .catch((err) => {
                        reject("There was an error verifying the user: " + err);
                    });
            })
            .catch((err) => {
                reject("Unable to find user: " + userData.userName);
            });
    })
}

module.export = {
    initialize,
    registerUser,
    checkUser
}