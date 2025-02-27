// models/index.js - Database models for Abah Farm website

const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required'],
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, 'Product description is required'],
        trim: true 
    },
    price: { 
        type: Number, 
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'] 
    },
    image: { 
        type: String, 
        required: [true, 'Product image is required'] 
    },
    category: { 
        type: String, 
        required: [true, 'Product category is required'],
        enum: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'other']
    },
    nutritionalInfo: {
        calories: { type: Number },
        protein: { type: Number },
        fat: { type: Number },
        carbs: { type: Number }
    },
    allergens: [{ type: String }],
    ingredients: [{ type: String }],
    inStock: { 
        type: Boolean, 
        default: true 
    },
    featured: { 
        type: Boolean, 
        default: false 
    },
    discount: {
        isDiscounted: { type: Boolean, default: false },
        percentage: { type: Number, default: 0 },
        validUntil: { type: Date }
    },
    sku: { 
        type: String, 
        unique: true,
        required: [true, 'Product SKU is required'] 
    },
    availableSizes: [{
        size: { type: String },
        price: { type: Number },
        inStock: { type: Boolean, default: true }
    }],
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
        date: { type: Date, default: Date.now }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true 
    },
    email: { 
        equired: [true, 'Name is required'],
        trim: true 
    },
});