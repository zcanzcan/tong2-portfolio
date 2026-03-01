'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PortfolioData {
    config: any;
    profile: any;
    heroButtons: any[];
    experience: any[];
    frontendSkills: any[];
    backendSkills: any[];
    otherSkills: any[];
    skills: any[];
    certifications: any[];
    projects: any[];
    socials: any[];
    learningData: any;
    publications: any[];
    calendar: any;
    blog: any;
}

interface PortfolioDataContextType {
    data: PortfolioData | null;
    isLoading: boolean;
    error: Error | null;
}

const PortfolioDataContext = createContext<PortfolioDataContextType | undefined>(undefined);

interface ProviderProps {
    children: ReactNode;
    initialData?: PortfolioData | null;
}

export function PortfolioDataProvider({ children, initialData = null }: ProviderProps) {
    const [data] = useState<PortfolioData | null>(initialData);

    return (
        <PortfolioDataContext.Provider value={{ data, isLoading: !initialData, error: null }}>
            {children}
        </PortfolioDataContext.Provider>
    );
}

export function usePortfolioData() {
    const context = useContext(PortfolioDataContext);
    if (context === undefined) {
        throw new Error('usePortfolioData must be used within a PortfolioDataProvider');
    }
    return context;
}
