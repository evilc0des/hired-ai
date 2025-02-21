const { getSupabaseClient } = require('../config/supabase');

class UserService {
    async updateUserProfile(userId, updatedData, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    ...updatedData,
                    id: userId,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            console.log(data);

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.log(error);
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    async getUserProfile(userId, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    async createOrUpdateJobProfile(userId, jobData, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);
            const { data, error } = await supabase
                .from('job_profiles')
                .upsert({
                    ...jobData,
                    id: userId,
                    updated_at: new Date().toISOString(),
                })
                .select()

}

module.exports = new UserService();