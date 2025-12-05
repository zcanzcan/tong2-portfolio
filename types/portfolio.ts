export interface Profile {
    name: string;
    title: string;
    bio: string;
    image: string;
    status: string;
    roles: string[];
    titleEn?: string;
    bioEn?: string;
    statusEn?: string;
    nameEn?: string;
}

export interface HeroButton {
    text: string;
    icon: string;
    url: string;
    variant: string;
    textEn?: string;
    dropdownItems?: { text: string; url: string }[];
}

export interface Social {
    id: string;
    name: string;
    icon: string;
    url: string;
    color?: string;
}

export interface Blog {
    title: string;
    description: string;
    url: string;
}

export interface Experience {
    id: number;
    role: string;
    company: string;
    period: string;
    color?: string;
}

export interface Skill {
    name: string;
    icon: string;
    color?: string;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    link: string;
    tags: string[];
    image: string;
    titleEn?: string;
    descriptionEn?: string;
}

export interface PurchaseLink {
    name: string;
    url: string;
}

export interface Publication {
    id: string;
    tag: string;
    title: string;
    description: string;
    image: string;
    link: string;
    titleEn?: string;
    descriptionEn?: string;
    tagEn?: string;
    purchaseLinks?: PurchaseLink[];
}

export interface Calendar {
    calendarId?: string;
    apiKey?: string;
    oauthClientId?: string;
    oauthClientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface PortfolioData {
    profile: Profile;
    heroButtons: HeroButton[];
    socials: Social[];
    blog: Blog;
    experience: Experience[];
    skills: Skill[];
    projects: Project[];
    publications: Publication[];
    calendar?: Calendar;
}
