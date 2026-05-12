export interface ShopData {
  name: string;
  address: string;
  phone: string;
  website: string;
}

export interface LeadData {
  id: string;
  link: string;
  shopData: ShopData | null;
}

export interface Settings {
  limit: number;
  messageTemplate?: string;
}

export type MessageMap = {
    // Lead Management
    'LEAD_FOUND': LeadData;
    'GET_ALL_LEADS': void;
    
    // Settings
    'GET_SETTINGS': void;
    'UPDATE_SETTINGS': Settings;
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
