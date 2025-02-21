const { getSupabaseClient } = require('../config/supabase');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('@langchain/core/output_parsers');
const { z } = require('zod');

class JobSearchProfileService {
    constructor() {
        this.model = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0,
            openAIApiKey: process.env.OPENAI_API_KEY
        });

        // Define the schema for our structured output
        this.outputParser = StructuredOutputParser.fromZodSchema(
            z.object({
                keywords: z.array(z.string()).describe("Technical skills, methodologies, domain expertise and designation. Group related skills into one searchable keyword. Make maximum 5 keywords."),
                experience_level: z.enum(["entry", "mid", "senior", "lead"]).describe("Experience level based on responsibilities and achievements"),
                industry_focus: z.array(z.string()).describe("Main industries and sectors worked in")
            })
        );

        // Create the prompt template
        this.prompt = PromptTemplate.fromTemplate(
            `You are an expert career analyst. Analyze the provided resume/profile and extract key insights.

{format_instructions}

Profile Information:
{profile}

Analyze the profile and provide:
1. Keywords: Technical skills, tools, methodologies, and domain expertise
2. Experience Level: Determine if the person is entry-level, mid-level, senior, or expert based on their experience and responsibilities
3. Industry Focus: Identify the main industries and sectors they've worked in`
        );
    }

    async upsertJobSearchProfileFromUserProfile(userId, profileData, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);

            // Extract relevant data from profile for job search
            const jobSearchData = await this.extractJobSearchData(profileData);

            // Check if job search profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('job_search_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
                throw fetchError;
            }

            const jobSearchProfile = {
                user_id: userId,
                ...jobSearchData,
                updated_at: new Date().toISOString(),
            };

            let result;
            if (!existingProfile) {
                // Insert new job search profile
                const { data, error } = await supabase
                    .from('job_search_profiles')
                    .insert([jobSearchProfile])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Update existing job search profile
                const { data, error } = await supabase
                    .from('job_search_profiles')
                    .update(jobSearchProfile)
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error updating job search profile:', error);
            throw error;
        }
    }

    async extractJobSearchData(profileData) {
        // Prepare the profile data for analysis
        const profileText = this.prepareProfileForAnalysis(profileData);

        // Get insights using LangChain
        const insights = await this.getLLMInsights(profileText);

        return {
            keywords: insights.keywords,
            experience_level: insights.experience_level,
            industry_focus: insights.industry_focus,
            job_types: [], // Will be set by user
            remote_preference: [], // Will be set by user
            expected_salary: null, // Will be set by user
            expected_salary_currency: null, // Will be set by user
            preferred_location: [], // Will be set by user
            preferred_company_size: [], // Will be set by user
            last_updated: new Date().toISOString(),
        };
    }

    prepareProfileForAnalysis(profileData) {
        let profileText = '';

        // Add summary if available
        if (profileData.summary) {
            profileText += `Professional Summary:\n${profileData.summary}\n\n`;
        }

        // Add skills
        if (profileData.skills && profileData.skills.length > 0) {
            profileText += `Skills:\n${profileData.skills.join(', ')}\n\n`;
        }

        // Add experience
        if (profileData.experience && profileData.experience.length > 0) {
            profileText += 'Work Experience:\n';
            profileData.experience.forEach(exp => {
                profileText += `- ${exp.position} at ${exp.company}\n`;
                profileText += `  Period: ${exp.startDate} to ${exp.endDate || 'Present'}\n`;
                if (exp.description) {
                    profileText += `  Description: ${exp.description}\n`;
                }
                profileText += '\n';
            });
        }

        // Add education
        if (profileData.education && profileData.education.length > 0) {
            profileText += 'Education:\n';
            profileData.education.forEach(edu => {
                profileText += `- ${edu.degree} in ${edu.field}\n`;
                profileText += `  Institution: ${edu.institution}\n`;
                profileText += `  Period: ${edu.startDate} to ${edu.endDate || 'Present'}\n\n`;
            });
        }

        return profileText;
    }

    async getLLMInsights(profileText) {
        try {
            // Format the prompt with the profile and output instructions
            const formattedPrompt = await this.prompt.format({
                profile: profileText,
                format_instructions: this.outputParser.getFormatInstructions()
            });

            // Get response from the model
            const response = await this.model.invoke(formattedPrompt);

            // Parse the response into structured data
            const result = await this.outputParser.parse(response.content);

            // Clean and validate the results
            return {
                keywords: this.cleanKeywords(result.keywords),
                experience_level: this.validateExperienceLevel(result.experience_level),
                industry_focus: this.cleanIndustries(result.industry_focus)
            };
        } catch (error) {
            console.error('Error getting LLM insights:', error);
            // Fallback to basic extraction if LLM fails
            return {
                keywords: this.extractBasicKeywords(profileText),
                experience_level: this.calculateExperienceLevel(profileText),
                industry_focus: this.extractBasicIndustries(profileText)
            };
        }
    }

    cleanKeywords(keywords) {
        // Remove duplicates and clean up keywords
        return [...new Set(keywords.map(k => k.toLowerCase().trim()))];
    }

    validateExperienceLevel(level) {
        const validLevels = ['entry', 'mid', 'senior', 'lead'];
        return validLevels.includes(level) ? level : 'mid'; // Default to mid if invalid
    }

    cleanIndustries(industries) {
        // Remove duplicates and clean up industry names
        return [...new Set(industries.map(i => i.toLowerCase().trim()))];
    }

    // Fallback methods in case LLM fails
    extractBasicKeywords(profileText) {
        const keywords = new Set();
        const words = profileText.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 3) {
                keywords.add(word);
            }
        });
        return Array.from(keywords);
    }

    calculateExperienceLevel(profileText) {
        // Basic experience level calculation based on text analysis
        if (profileText.toLowerCase().includes('senior') ||
            profileText.toLowerCase().includes('manager')) {
            return 'senior';
        }
        if (profileText.toLowerCase().includes('junior') ||
            profileText.toLowerCase().includes('associate')) {
            return 'entry';
        }
        return 'mid';
    }

    extractBasicIndustries(profileText) {
        // Basic industry extraction based on common industry terms
        const industries = new Set();
        const industryTerms = {
            'tech': ['software', 'technology', 'it', 'digital'],
            'finance': ['banking', 'finance', 'investment', 'accounting'],
            'healthcare': ['medical', 'healthcare', 'hospital', 'clinic'],
            'education': ['university', 'school', 'education', 'academic'],
            'retail': ['retail', 'store', 'shop', 'commerce']
        };

        Object.entries(industryTerms).forEach(([industry, terms]) => {
            if (terms.some(term => profileText.toLowerCase().includes(term))) {
                industries.add(industry);
            }
        });

        return Array.from(industries);
    }

    async getJobSearchProfile(userId, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);

            const { data, error } = await supabase
                .from('job_search_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching job search profile:', error);
            throw error;
        }
    }

    async updateJobSearchProfile(userId, profileData, sessionToken) {
        try {
            const supabase = getSupabaseClient(sessionToken);

            const { data, error } = await supabase
                .from('job_search_profiles')
                .update(profileData)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating job search profile:', error);
            throw error;
        }
    }
}

module.exports = new JobSearchProfileService(); 