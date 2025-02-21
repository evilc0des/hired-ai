import { Job } from "@/types/job"
import { UserProfile } from "@/types/profile"

export const mockProfileAPICall = async (): Promise<UserProfile> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({
                name: "John Doe",
                email: "john@example.com",
                phone: "(555) 123-4567",
                location: "New York, NY",
                skills: ["JavaScript", "React", "Node.js", "TypeScript"],
                experience: [
                    {
                        company: "Tech Corp",
                        position: "Senior Developer",
                        startDate: "2020-01-01",
                        endDate: "2024-12-31",
                        description: "Responsible for developing and maintaining the company's website and other web applications."
                    }
                ],
                education: [
                    {
                        institution: "University of Technology",
                        degree: "BS Computer Science",
                        year: "2019"
                    }
                ],
            })
        }, 1000)
    })
}

export const mockJobsAPICall = async (): Promise<Job[]> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve([
                    {
                        id: 1,
                        title: "Software Engineer",
                        description: "We are looking for a software engineer with 3 years of experience in React and Node.js.",
                        company: "Tech Corp",
                        location: "New York, NY",
                        salary: {
                            value: 100000,
                            currency: "USD"
                        },
                        jobType: "Full-Time",
                        jobCategory: "Software Development",
                        jobSubcategory: "Frontend Development",
                        skills: ["JavaScript", "React", "Node.js", "TypeScript"],
                        companySize: "1-10",
                        companyType: "Startup",
                        remote: true,
                        hybrid: false,
                        onsite: false,
                    },
                    {
                        id: 2,
                        title: "Software Engineer",
                        description: "We are looking for a software engineer with 5 years of experience in Node.js.",
                        company: "Google Inc",
                        location: "New York, NY",
                        salary: {
                            value: 150000,
                            currency: "USD"
                        },
                        jobType: "Full-Time",
                        jobCategory: "Software Development",
                        jobSubcategory: "Backend Development",
                        skills: ["JavaScript", "Node.js", "TypeScript", "Python"],
                        companySize: "200+",
                        companyType: "Enterprise",
                        remote: true,
                        hybrid: false,
                        onsite: false,
                    },
                    {
                        id: 3,
                        title: "Software Engineer",
                        description: "We are looking for a software engineer with 2 years of experience in React and Node.js.",
                        company: "Apple Inc",
                        location: "Cupertino, CA",
                        salary: {
                            value: 120000,
                            currency: "USD"
                        },
                        jobType: "Full-Time",
                        jobCategory: "Software Development",
                        jobSubcategory: "Frontend Development",
                        skills: ["JavaScript", "React", "Next.js", "TypeScript"],
                        companySize: "200+",
                        companyType: "Enterprise",
                        remote: false,
                        hybrid: false,
                        onsite: true,
                    }
                ])
        }, 1000)
    })
}