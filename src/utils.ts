export async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizePhone(phone: string): string {
    // 085075 08611 -> 8507508611
    return phone.replace(/[^\d+]/g, '').slice(-10);
}