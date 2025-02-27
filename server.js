// server.js - Main backend file for Abah Farm website

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/abah_farm', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
// Product Schema
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, default: 1 }
        }
    ],
    totalAmount: { type: Number, required: true },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'pending' },
    orderStatus: { type: String, default: 'processing' },
    createdAt: { type: Date, default: Date.now }
});

// Tour Booking Schema
const tourBookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: Date, required: true },
    groupSize: { type: String, required: true },
    message: { type: String },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Contact Message Schema
const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Newsletter Subscriber Schema
const newsletterSubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Create Models
const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const TourBooking = mongoose.model('TourBooking', tourBookingSchema);
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);

// Middleware for auth
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abahfarmsecret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};

// Admin middleware
const adminAuth = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// API Routes

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products', auth, adminAuth, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/products/:id', auth, adminAuth, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'abahfarmsecret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'abahfarmsecret',
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/auth/me', auth, (req, res) => {
    res.json({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin
    });
});

// Order Routes
app.post('/api/orders', auth, async (req, res) => {
    try {
        const order = new Order({
            ...req.body,
            user: req.user._id
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/orders', auth, async (req, res) => {
    try {
        // Regular users can only see their own orders
        // Admins can see all orders
        const filter = req.user.isAdmin ? {} : { user: req.user._id };
        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name price');
            
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'name price');
            
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Check if the user is authorized to view this order
        if (!req.user.isAdmin && !order.user._id.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/orders/:id', auth, adminAuth, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Tour Booking Routes
app.post('/api/tour-bookings', async (req, res) => {
    try {
        const booking = new TourBooking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/tour-bookings', auth, adminAuth, async (req, res) => {
    try {
        const bookings = await TourBooking.find({}).sort({ date: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/tour-bookings/:id', auth, adminAuth, async (req, res) => {
    try {
        const booking = await TourBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Contact Message Routes
app.post('/api/contact', async (req, res) => {
    try {
        const message = new ContactMessage(req.body);
        await message.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/contact', auth, adminAuth, async (req, res) => {
    try {
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/contact/:id', auth, adminAuth, async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Newsletter Subscription Routes
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if already subscribed
        const existingSubscriber = await NewsletterSubscriber.findOne({ email });
        
        if (existingSubscriber) {
            if (existingSubscriber.active) {
                return res.status(400).json({ message: 'Email already subscribed' });
            } else {
                // Reactivate subscription
                existingSubscriber.active = true;
                await existingSubscriber.save();
                return res.json({ message: 'Subscription reactivated successfully' });
            }
        }
        
        // Create new subscriber
        const subscriber = new NewsletterSubscriber({ email });
        await subscriber.save();
        
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/newsletter/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        const subscriber = await NewsletterSubscriber.findOne({ email });
        
        if (!subscriber) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        
        subscriber.active = false;
        await subscriber.save();
        
        res.json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/newsletter/subscribers', auth, adminAuth, async (req, res) => {
    try {
        const subscribers = await NewsletterSubscriber.find({ active: true }).sort({ createdAt: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Dashboard Routes
app.get('/api/admin/dashboard', auth, adminAuth, async (req, res) => {
    try {
        // Get counts and summary data for dashboard
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();
        const orderCount = await Order.countDocuments();
        const messageCount = await ContactMessage.countDocuments({ read: false });
        const tourBookingCount = await TourBooking.countDocuments({ status: 'pending' });
        const subscriberCount = await NewsletterSubscriber.countDocuments({ active: true });
        
        // Get recent orders
        const recentOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name')
            .select('totalAmount orderStatus createdAt');
            
        // Calculate revenue metrics (simplified)
        const allOrders = await Order.find({ paymentStatus: 'completed' });
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Get popular products based on order frequency
        const popularProducts = await Order.aggregate([
            { $unwind: '$products' },
            { $group: { _id: '$products.product', count: { $sum: '$products.quantity' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // Populate popular products with details
        const populatedPopularProducts = await Product.populate(popularProducts, {
            path: '_id',
            select: 'name price'
        });
        
        const dashboardData = {
            counts: {
                products: productCount,
                users: userCount,
                orders: orderCount,
                unreadMessages: messageCount,
                pendingTours: tourBookingCount,
                subscribers: subscriberCount
            },
            revenue: {
                total: totalRevenue,
                orderCount: allOrders.length
            },
            recentOrders,
            popularProducts: populatedPopularProducts.map(item => ({
                product: item._id,
                count: item.count
            }))
        };
        
        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Serve the frontend in production
if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static('client/build'));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing