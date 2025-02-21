"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { Button, Field, Fieldset, Input } from "@headlessui/react";
import Select from "react-select/base";
import CreatableSelect from "react-select/creatable";
import { DocumentPlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { mockProfileAPICall } from "@/utils/mock";
import { supabaseClient } from "@/lib/supabase/supabaseClient";


import { Experience, Education, UserProfile } from "@/types/profile";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [location, setLocation] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [skills, setSkills] = useState<string[]>([]);
    const [experience, setExperience] = useState<Experience[]>([]);
    const [education, setEducation] = useState<Education[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // Here you would implement the actual resume parsing logic
        // This is just a mock implementation
        try {
            const formData = new FormData();
            formData.append('resume', file);

            const { data: { session } } = await supabaseClient().auth.getSession();

            // Mock API call - replace with actual endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/parse-resume`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });
            const { parsed: data } = await response.json();

            // Mock data for demonstration
            // const data = await mockProfileAPICall();

            console.log(data);
            if (data) {
                setProfile(data);
            }

            setIsEditing(false);
            setIsUploading(false);
        } catch (error) {
            console.error("Error parsing resume:", error);
            setIsUploading(false);
        }
    };

    useEffect(() => {
        console.log(profile);
        if (profile) {
            setName(profile.name);
            setEmail(profile.email);
            setPhone(profile.phone);
            setLocation(profile.location || "");
            setSkills(profile.skills);
            setExperience(profile.experience);
            setEducation(profile.education);
        }
    }, [profile]);

    useEffect(() => {
        if (!profile) {
            const fetchProfile = async () => {
                const { data: { session } } = await supabaseClient().auth.getSession();

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });
                const profile = await response.json();
                setProfile(profile);
                setIsLoading(false);
            };
            fetchProfile();
        }
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>, partialProfile: Partial<UserProfile>) => {
        e.preventDefault();
        if (!profile) return;
        const updatedProfile = {
            ...profile,
            ...partialProfile
        };
        const { data: { session } } = await supabaseClient().auth.getSession();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
            method: 'PUT',
            body: JSON.stringify(updatedProfile),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            }
        });
        const { data: savedProfile } = await response.json();
        setProfile(savedProfile);
        setIsEditing(false);
    };

    const handleManualEntry = () => {
        const newProfile = {
            name: "",
            email: "",
            phone: "",
            location: "",
            skills: [],
            experience: [],
            education: [],
        }
        setProfile(newProfile)
        setIsEditing(true)
    }

    return (
        <div className="p-8 ml-16">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>
            {isLoading ? (
                <div className="flex flex-col justify-center items-center mt-[200px]">
                    <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-r-4 border-gray-900 dark:border-white"></div>
                    <p className="text-gray-600 dark:text-gray-300 text-2xl">Fetching Profile</p>
                </div>
            ) : (
                profile ? (
                    <div className="space-y-6 max-w-2xl">
                        <div className="mb-8">
                            <label className="block mb-4">
                                <span className="text-gray-700 dark:text-gray-200">Upload Resume</span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="mt-1 block w-full max-w-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-foreground file:text-background hover:file:bg-[#383838] dark:hover:file:bg-[#ccc]"
                                    disabled={isUploading}
                                />
                            </label>
                            {isUploading && (
                                <p className="text-sm text-gray-500">Analyzing resume...</p>
                            )}
                        </div>
                        <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-6 rounded-lg">
                            <div className="flex items-center justify-between  mb-4">
                                <h2 className="text-xl font-semibold">Personal Information</h2>
                                {!isEditing ?
                                    <PencilIcon onClick={() => setIsEditing(true)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> :
                                    <XMarkIcon onClick={() => setIsEditing(false)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />}
                            </div>
                            {!isEditing && (
                                <div className="flex flex-col gap-2">
                                    <p><strong>Name:</strong> {profile.name}</p>
                                    <p><strong>Email:</strong> {profile.email}</p>
                                    <p><strong>Phone:</strong> {profile.phone}</p>
                                    <p><strong>Location:</strong> {profile.location || "N/A"}</p>
                                </div>
                            )}
                            {isEditing && (
                                <form className="flex flex-col gap-2" onSubmit={(e) => handleSave(e, { name, email, phone, location })}>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="name">Name</label>
                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email">Email</label>
                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="email" id="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="phone">Phone</label>
                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="tel" id="phone" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="location">Location</label>
                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" id="location" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                                    </div>
                                    <Button type="submit" className="cursor-pointer bg-foreground text-background rounded-md p-2 px-4 mt-4 self-start">Save</Button>
                                </form>
                            )}
                        </div>

                        <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-6 rounded-lg">
                            <div className="flex items-center justify-between  mb-4">
                                <h2 className="text-xl font-semibold">Skills</h2>
                                {!isEditing ?
                                    <PencilIcon onClick={() => setIsEditing(true)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> :
                                    <XMarkIcon onClick={() => setIsEditing(false)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />}
                            </div>
                            {!isEditing && (
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-background rounded-full text-sm border border-black/[.08] dark:border-white/[.145]"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {isEditing && (
                                <form className="flex flex-col gap-2" onSubmit={(e) => handleSave(e, { skills })}>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="skills">Skills</label>
                                        <CreatableSelect
                                            isMulti
                                            name="skills"
                                            options={[
                                                { label: "JavaScript", value: "javascript" },
                                                { label: "React", value: "react" },
                                                { label: "Node.js", value: "nodejs" },
                                                { label: "TypeScript", value: "typescript" },
                                            ]}
                                            value={skills.map((skill) => ({ label: skill, value: skill }))}
                                            onChange={(value) => {
                                                setSkills(value.map((skill) => skill.value));
                                            }}
                                        />
                                    </div>
                                    <Button type="submit" className="cursor-pointer bg-foreground text-background rounded-md p-2 px-4 mt-4 self-start">Save</Button>
                                </form>
                            )}
                        </div>

                        <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-6 rounded-lg">
                            <div className="flex items-center justify-between  mb-4">
                                <h2 className="text-xl font-semibold">Experience</h2>
                                {!isEditing ?
                                    <PencilIcon onClick={() => setIsEditing(true)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> :
                                    <XMarkIcon onClick={() => setIsEditing(false)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />}
                            </div>
                            {!isEditing && (
                                <div className="flex flex-col gap-2">
                                    {profile.experience.map((exp, index) => (
                                        <div key={index} className="mb-4">
                                            <h3 className="font-semibold">{exp.position}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{exp.company}</p>
                                            <p className="text-sm text-gray-500">{exp.startDate} - {exp.endDate}</p>
                                            <p className="text-sm text-gray-500">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isEditing && (
                                <form className="flex flex-col gap-2" onSubmit={(e) => handleSave(e, { experience })}>
                                    {
                                        experience.map((exp, index) => (
                                            <div key={exp.position + exp.company || "new"} className="flex flex-col gap-2 mb-4 border-b border-gray-200 pb-4">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="flex flex-col gap-2 col-span-3">
                                                        <label htmlFor="experience">Designation</label>
                                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" value={exp.position} onChange={(e) => setExperience(experience.map((exp, i) => i === index ? { ...exp, position: e.target.value } : exp))} id="experience" placeholder="Designation" />
                                                    </div>
                                                    <div className="flex flex-col gap-2 col-span-1">
                                                        <label htmlFor="company">Company</label>
                                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" value={exp.company} onChange={(e) => setExperience(experience.map((exp, i) => i === index ? { ...exp, company: e.target.value } : exp))} id="company" placeholder="Company" />
                                                    </div>
                                                    <div className="flex flex-col gap-2 col-span-1">
                                                        <label htmlFor="duration">Start Date</label>
                                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="date" value={exp.startDate} onChange={(e) => setExperience(experience.map((exp, i) => i === index ? { ...exp, startDate: e.target.value } : exp))} id="duration" placeholder="Start Date" />
                                                    </div>
                                                    <div className="flex flex-col gap-2 col-span-1">
                                                        <label htmlFor="duration">End Date</label>
                                                        <input className="border border-gray-300 rounded-md p-2 bg-background" type="date" value={exp.endDate} onChange={(e) => setExperience(experience.map((exp, i) => i === index ? { ...exp, endDate: e.target.value } : exp))} id="duration" placeholder="End Date" />
                                                    </div>
                                                    <div className="flex flex-col gap-2 col-span-3">
                                                        <label htmlFor="description">Description</label>
                                                        <textarea className="border border-gray-300 rounded-md p-2 bg-background" value={exp.description} onChange={(e) => setExperience(experience.map((exp, i) => i === index ? { ...exp, description: e.target.value } : exp))} id="description" placeholder="Description" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    <Button type="button" className="flex items-center gap-2 cursor-pointer"
                                        onClick={() => setExperience([...experience, { company: "", position: "", startDate: "", endDate: "", description: "" }])}>
                                        <PlusIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> Add Experience
                                    </Button>
                                    <Button type="submit" className="cursor-pointer bg-foreground text-background rounded-md p-2 px-4 mt-4 self-start">Save</Button>
                                </form>
                            )}
                        </div>

                        <div className="bg-[#f2f2f2] dark:bg-[#1a1a1a] p-6 rounded-lg">
                            <div className="flex items-center justify-between  mb-4">
                                <h2 className="text-xl font-semibold">Education</h2>
                                {!isEditing ?
                                    <PencilIcon onClick={() => setIsEditing(true)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> :
                                    <XMarkIcon onClick={() => setIsEditing(false)} className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />}
                            </div>
                            {!isEditing && (
                                <div className="flex flex-col gap-2">
                                    {profile.education.map((edu, index) => (
                                        <div key={index} className="mb-4">
                                            <h3 className="font-semibold">{edu.degree}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{edu.institution}</p>
                                            <p className="text-sm text-gray-500">{edu.year}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isEditing && (
                                <form className="flex flex-col gap-2" onSubmit={(e) => handleSave(e, { education })}>
                                    <div className="flex flex-col gap-2 mb-4 border-b border-gray-200 pb-4">
                                        {education.map((edu, index) => (
                                            <div key={index || "new"} className="grid grid-cols-2 gap-2 mb-4 border-b border-gray-200 pb-4">
                                                <div className="flex flex-col gap-2 col-span-2">
                                                    <label htmlFor="education">Degree</label>
                                                    <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" value={edu.degree} onChange={(e) => setEducation((prevState) => prevState.map((edu, i) => i === index ? { ...edu, degree: e.target.value } : edu))} id="education" placeholder="Degree" />
                                                </div>
                                                <div className="flex flex-col gap-2 col-span-1">
                                                    <label htmlFor="institution">Institution</label>
                                                    <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" value={edu.institution} onChange={(e) => setEducation(education.map((edu, i) => i === index ? { ...edu, institution: e.target.value } : edu))} id="institution" placeholder="Institution" />
                                                </div>
                                                <div className="flex flex-col gap-2 col-span-1">
                                                    <label htmlFor="year">Year</label>
                                                    <input className="border border-gray-300 rounded-md p-2 bg-background" type="text" value={edu.year} onChange={(e) => setEducation(education.map((edu, i) => i === index ? { ...edu, year: e.target.value } : edu))} id="year" placeholder="Year" />
                                                </div>
                                                <button type="button" className="flex items-center gap-2 cursor-pointer"
                                                    onClick={() => setEducation(education.filter((_, i) => i !== index))}>
                                                    <TrashIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" className="flex items-center gap-2 cursor-pointer"
                                        onClick={() => setEducation([...education, { institution: "", degree: "", year: "" }])}>
                                        <PlusIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> Add Education
                                    </Button>
                                    <Button type="submit" className="cursor-pointer bg-foreground text-background rounded-md p-2 px-4 mt-4 self-start">Save</Button>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center max-w-md mx-auto p-8 bg-[#f2f2f2] dark:bg-[#1a1a1a] rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300">
                            Upload your resume to automatically populate your profile information. Or enter your information manually.
                        </p>
                        <div className="flex justify-center gap-2">
                            <Button className="cursor-pointer bg-foreground text-background rounded-md p-2 px-4 mt-4 self-start" onClick={() => handleManualEntry()}>
                                <span className="flex items-center gap-2 align-baseline"><PencilIcon className="w-5 h-5 text-background hover:text-gray-400 dark:hover:text-gray-300 cursor-pointer" /> Enter Manually</span>
                            </Button>
                            <Button className="cursor-pointer bg-background text-foreground border border-foreground rounded-md p-2 px-4 mt-4 self-start" onClick={() => handleFileUpload}>
                                <span className="flex items-center gap-2 align-baseline"><DocumentPlusIcon className="w-5 h-5 text-foreground hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" /> Upload Resume</span>
                            </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            {isUploading && (
                                <p className="text-sm text-gray-500">Analyzing resume...</p>
                            )}
                        </p>
                    </div>
                )
            )}
        </div>
    );
}
