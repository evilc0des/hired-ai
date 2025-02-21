require('dotenv').config();
const express = require('express');
const cors = require('cors');
const upload = require('./middleware/uploadMiddleware');
const parseResume = require('./middleware/resumeParserMiddleware');
const authMiddleware = require('./middleware/authMiddleware');
const userService = require('./services/userService');
const { supabase } = require('./config/supabase');
const jobSearchProfileService = require('./services/jobSearchProfileService');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware
app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Raw Body:', req.body);
    next();
});

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Signup error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Protected routes
app.post('/api/parse-resume', authMiddleware, upload.single('resume'), parseResume, (req, res) => {
    res.json({
        parsed: req.parsedResume,
        profile: req.updatedProfile
    });
});

app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const profile = await userService.getUserProfile(req.user.id, req.headers.authorization?.split(' ')[1]);
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        // Basic input validation
        const requiredFields = ['name', 'email'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Update profile
        const profile = await userService.updateUserProfile(
            req.user.id,
            req.body,
            req.headers.authorization?.split(' ')[1]
        );

        // Create or update job search profile
        const jobSearchProfile = await jobSearchProfileService.upsertJobSearchProfileFromUserProfile(
            req.user.id,
            profile,
            req.headers.authorization?.split(' ')[1]
        );

        // Return success response
        res.status(200).json({
            message: 'Profile updated successfully',
            data: profile
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

app.put('/api/job-search-profile', authMiddleware, async (req, res) => {
    try {
        const jobSearchProfile = await jobSearchProfileService.updateJobSearchProfile(
            req.user.id,
            req.body,
            req.headers.authorization?.split(' ')[1]
        );

        res.status(200).json({
            message: 'Job search profile updated successfully',
            data: jobSearchProfile
        });
    } catch (error) {
        console.error('Error updating job search profile:', error);
        res.status(500).json({
            error: 'Failed to update job search profile',
            message: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 