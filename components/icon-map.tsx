import {
    Code2, Globe, Terminal, Layout, Server, Database, Smartphone, Layers, Cpu,
    FileJson, Cloud, GitBranch, Command, Hash, Monitor, Wifi, Box, Award, ExternalLink,
    ArrowRight, Download, Mail, Coffee, Lock, FileText, Image, Github, Linkedin, AtSign, BookText, Link as LinkIcon,
    Edit, Trash, Plus, Check, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Share,
    Calendar, Clock, User, Users, Briefcase, Info, Home, Settings, Search, Menu
} from 'lucide-react'

export const iconMap: Record<string, any> = {
    Code2, Globe, Terminal, Layout, Server, Database, Smartphone, Layers, Cpu,
    FileJson, Cloud, GitBranch, Command, Hash, Monitor, Wifi, Box, Award, ExternalLink,
    ArrowRight, Download, 'DownloadCloud': Download, Mail, Coffee, Lock, FileText, Image, Github, Linkedin, AtSign, BookText, LinkIcon, 'Link': LinkIcon,
    Edit, Trash, Plus, Check, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Share,
    Calendar, Clock, User, Users, Briefcase, Info, Home, Settings, Search, Menu
}

export function getIcon(iconName: string, fallback: any = ExternalLink) {
    return iconMap[iconName] || fallback
}
