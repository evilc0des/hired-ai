const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Create a superuser client for auth operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a function to get a new Supabase client with the user's session token
const getSupabaseClient = (sessionToken) => {
    return createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                Authorization: `Bearer ${sessionToken}`
            }
        }
    });
};

module.exports = { supabase, getSupabaseClient };