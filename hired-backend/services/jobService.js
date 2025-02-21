const { getSupabaseClient } = require('../config/supabase');
const linkedin = require('linkedin-jobs-api');

class JobService {
    constructor() {
        // No initialization needed as linkedin-jobs-api is stateless
    }

    async searchAndMatchJobs(userId, sessionToken, options = {}) {
        try {
            // Get user's job search profile
            const { data: jobSearchProfile, error: profileError } = await this.getJobSearchProfile(userId, sessionToken);
            if (profileError) throw profileError;

            // Get LinkedIn jobs based on profile preferences
            const jobs = await this.fetchLinkedInJobs(jobSearchProfile, options);

            // Match and score jobs against the profile
            const matchedJobs = this.matchJobsWithProfile(jobs, jobSearchProfile);

            // Store matched jobs in Supabase for future reference
            await this.storeMatchedJobs(userId, matchedJobs, sessionToken);

            return matchedJobs;
        } catch (error) {
            console.error('Error in searchAndMatchJobs:', error);
            throw error;
        }
    }

    async getJobSearchProfile(userId, sessionToken) {
        const supabase = getSupabaseClient(sessionToken);
        const { data, error } = await supabase
            .from('job_search_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    async fetchLinkedInJobs(profile, options = {}) {
        try {
            // Build search parameters based on profile
            const searchParams = this.buildSearchParams(profile, options);

            // Fetch jobs using linkedin-jobs-api
            const jobs = await linkedin.query(searchParams);
            return jobs || [];
        } catch (error) {
            console.error('Error fetching LinkedIn jobs:', error);
            throw error;
        }
    }

    buildSearchParams(profile, options) {
        const {
            keywords,
            experience_level,
            industry_focus,
            preferred_location,
            job_types,
            expected_salary
        } = profile;

        // Build search parameters according to linkedin-jobs-api format
        const params = {
            keyword: keywords.join(' '), // Space-separated keywords
            location: preferred_location.join(','),
            jobType: this.mapJobType(job_types[0]), // Use first job type as primary
            experienceLevel: this.mapExperienceLevel(experience_level),
            dateSincePosted: options.dateSincePosted || 'past month',
            remoteFilter: this.mapRemoteFilter(job_types),
            salary: this.mapSalary(expected_salary),
            limit: options.limit || 25,
            page: options.page || 0,
            sortBy: options.sortBy || 'recent'
        };

        return params;
    }

    mapJobType(type) {
        const jobTypeMap = {
            'full-time': 'full time',
            'part-time': 'part time',
            'contract': 'contract',
            'temporary': 'temporary',
            'internship': 'internship'
        };
        return jobTypeMap[type] || 'full time';
    }

    mapExperienceLevel(level) {
        const levelMap = {
            'entry': 'entry level',
            'mid': 'associate',
            'senior': 'senior',
            'lead': 'director'
        };
        return levelMap[level] || 'entry level';
    }

    mapRemoteFilter(jobTypes) {
        if (jobTypes.includes('remote')) return 'remote';
        if (jobTypes.includes('hybrid')) return 'hybrid';
        return 'on-site';
    }

    mapSalary(salary) {
        if (!salary) return '';
        
        // Map salary to LinkedIn's salary ranges
        const ranges = {
            40000: '40000',
            60000: '60000',
            80000: '80000',
            100000: '100000',
            120000: '120000'
        };

        // Find the closest range
        const closest = Object.keys(ranges).reduce((prev, curr) => {
            return Math.abs(curr - salary) < Math.abs(prev - salary) ? curr : prev;
        });

        return ranges[closest];
    }

    matchJobsWithProfile(jobs, profile) {
        return jobs.map(job => {
            const matchScore = this.calculateMatchScore(job, profile);
            return {
                ...job,
                matchScore,
                matchDetails: this.getMatchDetails(job, profile)
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }

    calculateMatchScore(job, profile) {
        let score = 0;
        const weights = {
            keywords: 0.4,
            experience: 0.3,
            industry: 0.2,
            location: 0.1
        };

        // Calculate keyword match score
        const keywordScore = this.calculateKeywordMatch(job.description, profile.keywords);
        score += keywordScore * weights.keywords;

        // Calculate experience level match
        const experienceScore = this.calculateExperienceMatch(job, profile.experience_level);
        score += experienceScore * weights.experience;

        // Calculate industry match
        const industryScore = this.calculateIndustryMatch(job, profile.industry_focus);
        score += industryScore * weights.industry;

        // Calculate location match if preferred locations are specified
        if (profile.preferred_location && profile.preferred_location.length > 0) {
            const locationScore = this.calculateLocationMatch(job, profile.preferred_location);
            score += locationScore * weights.location;
        }

        return Math.round(score * 100); // Convert to percentage
    }

    calculateKeywordMatch(jobDescription, keywords) {
        const description = jobDescription.toLowerCase();
        const matchedKeywords = keywords.filter(keyword => 
            description.includes(keyword.toLowerCase())
        );
        return matchedKeywords.length / keywords.length;
    }

    calculateExperienceMatch(job, profileLevel) {
        const jobLevel = job.experienceLevel?.toLowerCase() || '';
        const levelMap = {
            'entry level': 1,
            'associate': 2,
            'senior': 3,
            'director': 4
        };

        const jobLevelValue = levelMap[jobLevel] || 2;
        const profileLevelValue = levelMap[profileLevel] || 2;

        // Calculate how close the levels are
        const diff = Math.abs(jobLevelValue - profileLevelValue);
        return Math.max(0, 1 - diff / 3); // 1 for exact match, 0.67 for one level off, 0.33 for two levels off
    }

    calculateIndustryMatch(job, industries) {
        if (!industries || industries.length === 0) return 1;
        
        const jobIndustry = job.industry?.toLowerCase() || '';
        return industries.some(industry => 
            jobIndustry.includes(industry.toLowerCase())
        ) ? 1 : 0;
    }

    calculateLocationMatch(job, preferredLocations) {
        if (!preferredLocations || preferredLocations.length === 0) return 1;

        const jobLocation = job.location?.toLowerCase() || '';
        return preferredLocations.some(location => 
            jobLocation.includes(location.toLowerCase())
        ) ? 1 : 0;
    }

    getMatchDetails(job, profile) {
        return {
            matchedKeywords: profile.keywords.filter(keyword => 
                job.description.toLowerCase().includes(keyword.toLowerCase())
            ),
            experienceMatch: this.calculateExperienceMatch(job, profile.experience_level),
            industryMatch: this.calculateIndustryMatch(job, profile.industry_focus),
            locationMatch: profile.preferred_location ? 
                this.calculateLocationMatch(job, profile.preferred_location) : null
        };
    }

    async storeMatchedJobs(userId, matchedJobs, sessionToken) {
        const supabase = getSupabaseClient(sessionToken);
        
        // Store each matched job
        for (const job of matchedJobs) {
            const { error } = await supabase
                .from('matched_jobs')
                .upsert({
                    user_id: userId,
                    job_id: job.jobId,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    match_score: job.matchScore,
                    match_details: job.matchDetails,
                    job_url: job.link,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error storing matched job:', error);
                // Continue with other jobs even if one fails
            }
        }
    }

    async getMatchedJobs(userId, sessionToken, options = {}) {
        const supabase = getSupabaseClient(sessionToken);
        
        let query = supabase
            .from('matched_jobs')
            .select('*')
            .eq('user_id', userId)
            .order('match_score', { ascending: false });

        // Add pagination if specified
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }
}

module.exports = new JobService();
