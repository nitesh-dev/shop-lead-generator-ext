export type LeadStatus = 'new' | 'contacted' | 'interested' | 'not-interested';

export interface LeadData {
    id: string;
    siteUrl: string;
    businessName: string;
    contactEmail?: string;
    contactPhone?: string;
    status: LeadStatus;
}

export type MessageMap = {
    // Lead Management
    'LEAD_FOUND': { lead: LeadData };
    'GET_ALL_LEADS': void;
    
    // Auth & Settings
    'GET_AUTH_STATUS': void;
    'UPDATE_SETTINGS': { theme: 'light' | 'dark'; apiKey?: string };
    
    // Commands
    'START_SCRAPING': { url: string };
    'STOP_SCRAPING': void;
};

export type MessageType = keyof MessageMap;

export interface ExtensionMessage<K extends MessageType = MessageType> {
    type: K;
    payload: MessageMap[K];
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}
