const fs = require('fs');
const pdfParse = require('pdf-parse');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { z } = require('zod');
const userService = require('../services/userService');
const jobSearchProfileService = require('../services/jobSearchProfileService');

// Initialize OpenAI
const openai = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o-mini",
});

const resumeSchema = z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    summary: z.string(),
    skills: z.array(z.string()),
    certifications: z.array(z.string()),
    experience: z.array(z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string(),
    })),
    education: z.array(z.object({
        institution: z.string(),
        degree: z.string(),
        year: z.string(),
    })),
});

// Resume parsing prompt template

const promptTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an expert ATS assistant that extracts structured information from resume. Analyze the following resume raw data and structure it into a JSON object. Leave the properties empty if you cannot find the information.`,
    ],
    ["human", "{text}"],
  ]);

// Parse PDF and analyze with AI
async function analyzeResume(filePath) {
    try {
        // Read and parse PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        console.log(pdfData.text);

        // Create prompt with the extracted text
        const prompt = await promptTemplate.invoke({
            text: pdfData.text,
        });

        const structured_llm = await openai.withStructuredOutput(resumeSchema);

        // Get AI analysis
        const response = await structured_llm.invoke(prompt);

        // Parse the response into JSON
        return response;
    } catch (error) {
        console.error('Error analyzing resume:', error);
        throw error;
    }
}

// Middleware function
const parseResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(req.file.path);

        const result = await analyzeResume(req.file.path);

        console.log(req.user);

        // Save the parsed resume to the database
        const updatedProfile = await userService.updateUserProfile(req.user.id, result, req.headers.authorization?.split(' ')[1]);

        // Create job search profile
        const jobSearchProfile = await jobSearchProfileService.upsertJobSearchProfileFromUserProfile(req.user.id, result, req.headers.authorization?.split(' ')[1]);
        
        // Clean up: delete the uploaded file
        fs.unlinkSync(req.file.path);
        
        // Attach the parsed result to the request object
        req.parsedResume = result;
        next();
    } catch (error) {
        console.error('Error processing resume:', error);
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Error processing resume' });
    }
};

module.exports = parseResume; 