export interface ShopData {
  name: string;
  address: string;
  phone: string;
  website: string;
  category?: string;
  rating?: string | number;
  reviews?: string | number;
  mapUrl?: string;
}

export interface LeadData {
  id: string;
  link: string;
  shopData: ShopData | null;
  status?: 'pending' | 'sent' | 'failed';
}

export interface Settings {
  limit: number;
  messageTemplate?: string;
  whatsappLimit?: number;
}

export type MessageMap = {
    // Lead Management
    'LEAD_FOUND': LeadData;
    'GET_ALL_LEADS': void;
    'IMPORT_LEADS': LeadData[];
    'CLEAR_ALL_LEADS': void;
    'RESET_LEADS_STATUS': void;
    
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
