export async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
}