export interface Experience {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Education {
    institution: string;
    degree: string;
    year: string;
}

export interface UserProfile {
    location?: string;
    name: string;
    email: string;
    phone: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
}