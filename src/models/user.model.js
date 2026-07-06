const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: {          
        type: String,
        default: null,
        unique: true,
        sparse: true
    },
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }, // Google login không cần password
        select: false,
        default: null
    },
    phone: {
        type: String,
        unique: true
    },
    address: {
        type: String,
        default: null
    },
    position: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiresAt: {
        type: Date,
        default: null
    },
    otpSentAt: {
        type: Date,
        default: null
    },
    isResetVerified: {
        type: Boolean,
        default: false
    },
    resetOtp: {
        type: String,
        default: null
    },
    resetOtpExpiresAt: {
        type: Date,
        default: null
    },
    resetOtpSentAt: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String,
        default: null
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    }
},
    {timestamps: true}
);

module.exports = mongoose.model('User', userSchema);