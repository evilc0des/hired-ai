'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { UserProfile } from '@/types/profile';
import { Button } from '@headlessui/react';
import AutoComplete from 'react-google-autocomplete';
import Select from 'react-select';
import { mockJobsAPICall } from '@/utils/mock';

type JobType = "REMOTE" | "HYBRID" | "ONSITE"
type CompanySize = "1-10" | "11-50" | "51-200" | "201+"

const JOB_TYPES: JobType[] = [
    "REMOTE",
    "HYBRID",
    "ONSITE"
] 

const COMPANY_SIZES: CompanySize[] = [
    "1-10",
    "11-50",
    "51-200",
    "201+"
]

export default function JobsPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locations, setLocations] = useState<string[]>([]);
    const [companySize, setCompanySize] = useState<CompanySize[]>([]);
    const [salaryRange, setSalaryRange] = useState<{ min: number, max: number }>({ min: 0, max: 0 });

    useEffect(() => {
        async function fetchProfileAndJobs() {
            setIsLoading(true);
            try {
                // Fetch user profile
                const { data: { session } } = await supabaseClient().auth.getSession();
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });
                const profileData = await response.json();
                setProfile(profileData);

                // Fetch matching jobs based on profile
                // const jobsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/matches`, {
                //     headers: {
                //         'Authorization': `Bearer ${session?.access_token}`
                //     }
                // });
                // const { data: jobsData } = await jobsResponse.json();


                const jobsData = await mockJobsAPICall();
                setJobs(jobsData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProfileAndJobs();
    }, []);

    const handleApplyFilters = async () => {
        const data = {
            job_types: jobTypes,
            preferred_location: locations,
            preferred_salary: salaryRange.min,
            preferred_salary_currency: "USD",
            preferred_company_size: companySize
        }

        const { data: { session } } = await supabaseClient().auth.getSession();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/job-search-profile`, {
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify(data)
        });
        console.log(response);
    }

    return (
        <div className="p-8 ml-16">
            <h1 className="text-3xl font-bold mb-8">Job Matches</h1>
            <div className="grid grid-cols-[3fr_1fr]">

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center mt-[200px]">
                        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-r-4 border-gray-900 dark:border-white"></div>
                        <p className="text-gray-600 dark:text-gray-300 text-2xl">Finding your matches</p>
                    </div>
                ) : jobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-6 rounded-lg">
                                <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">{job.company}</p>
                                <p className="text-gray-500 mb-4">{job.location}</p>
                                <p className="text-sm mb-4 line-clamp-3">{job.description}</p>
                                <div className="flex gap-2">
                                    <Button className="bg-foreground text-background p-2 rounded-md">Apply Now</Button>
                                    <Button className="bg-foreground text-background p-2 rounded-md">Save</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center max-w-md mx-auto p-8 bg-[#f2f2f2] dark:bg-[#1a1a1a] rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300">
                            {profile ?
                                "We're currently finding jobs that match your profile. Check back soon!" :
                                "Please complete your profile to see job matches."
                            }
                        </p>
                    </div>
                )}
                <div className="border-l border-gray-300 dark:border-gray-700 pl-8 ml-8 min-h-[calc(100vh-10rem)]">
                    <h2 className="text-xl font-semibold mb-6">Preferences</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-px">
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">Location</p>
                            <AutoComplete
                                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                                onPlaceSelected={(place) => {
                                    console.log(place);
                                    setLocations([...locations, place.formatted_address]);
                                }}
                                placeholder="Amsterdam, New York etc..."
                                className="border-2 border-gray-300 rounded-md p-2"
                            />
                            <div className="flex flex-wrap gap-2">
                                {locations.map((location) => (
                                    <div key={location} className="bg-foreground text-background px-2 py-1 rounded-md">
                                        {location}
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div className="flex flex-col gap-px">
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">Job Type</p>
                            <Select
                                options={JOB_TYPES.map((jobType) => ({
                                    label: jobType.charAt(0) + jobType.slice(1).toLowerCase(),
                                    value: jobType
                                }))}
                                onChange={(options) => setJobTypes(options.map((option) => option.value))}
                                value={jobTypes.map((jobType) => ({
                                    label: jobType.charAt(0) + jobType.slice(1).toLowerCase(),
                                    value: jobType
                                }))}
                                isMulti
                                name="jobTypes"
                                className="border-2 border-gray-300 rounded-md py-px"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        border: 'none'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        border: 'none'
                                    }),
                                    menuList: (base) => ({
                                        ...base,
                                        border: 'none'
                                    }),
                                    option: (base) => ({
                                        ...base,
                                        border: 'none'
                                    }),
                                    input: (base) => ({
                                        ...base,
                                        border: 'none'
                                    })
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-px">
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">Salary Expectation</p>
                            <div className="flex gap-2 items-center">
                                <input type="number" className="border-2 border-gray-300 rounded-md p-2" />
                                <span className="text-gray-600 dark:text-gray-300">-</span>
                                <input type="number" className="border-2 border-gray-300 rounded-md p-2" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-px">
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">Job Title</p>
                            <input type="text" className="border-2 border-gray-300 rounded-md p-2" />   
                        </div>
                        <div className="flex flex-col gap-px">
                            <p className="text-gray-600 dark:text-gray-300 font-semibold">Company Size</p>
                            <Select
                                options={COMPANY_SIZES.map((companySize) => ({
                                    label: companySize,
                                    value: companySize
                                }))}
                                onChange={(options) => setCompanySize(options.map((option) => option.value))}
                                value={companySize.map((companySize) => ({
                                    label: companySize,
                                    value: companySize
                                }))}
                                name="companySize"
                                className="border-2 border-gray-300 rounded-md py-px"
                                isMulti
                            />
                        </div>
                    </div>
                    <Button className="bg-foreground text-background mt-8 p-3 rounded-md" disabled={!profile} onClick={() => handleApplyFilters()}>APPLY FILTERS</Button>
                </div>
            </div>
        </div>
    );
}
