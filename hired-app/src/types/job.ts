export interface Job {
    id: number;
    title: string;
    description: string;
    company: string;
    location: string;
    salary: {
        value: number;
        currency: string;
    };
    jobType: string;
    jobCategory: string;
    jobSubcategory: string;
    skills: string[];
    companySize: string;
    companyType: string;
    remote: boolean;
    hybrid: boolean;
    onsite: boolean;
}