const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

module.exports = function (passport) {

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            let user = await User.findOne({ email });

            if (user) {
                return done(null, user);
            }

            const randomPassword = crypto.randomBytes(20).toString('hex');

            user = new User({
                name: profile.displayName || "Google User",
                email,
                password: randomPassword
            });

            await user.save();
            done(null, user);

        } catch (err) {
            console.error("Google Error:", err);
            done(err, null);
        }
    }));


 /*passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "https://swiftlogistics-backend.onrender.com/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'name', 'emails']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log("FB PROFILE:", profile);

           
            let email = profile.emails && profile.emails[0]?.value;

            if (!email) {
                email = `fb_${profile.id}@facebook.com`;
            }

            
            const firstName = profile.name?.givenName || "";
            const lastName = profile.name?.familyName || "";

            const fullName = (firstName + " " + lastName).trim();

            
            let user = await User.findOne({ email });

           if (user) {
   
    const updatedName = fullName || profile.displayName;

    if (updatedName && user.name !== updatedName) {
        user.name = updatedName;
        await user.save();
    }

    return done(null, user);
}

            
            const randomPassword = crypto.randomBytes(20).toString('hex');

            user = new User({
                name: fullName || profile.displayName || `User_${profile.id}`,
                email,
                password: randomPassword
            });

        
            try {
                await user.save();
            } catch (err) {
                if (err.code === 11000) {
                    user = await User.findOne({ email });
                    return done(null, user);
                }
                throw err;
            }

            done(null, user);

        } catch (err) {
            console.error("Facebook Error:", err);
            done(err, null);
        }
    }));*/
};