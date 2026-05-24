import { ConfigService } from '@nestjs/config';
export declare class ChapaService {
    private configService;
    private readonly logger;
    private readonly secretKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    initializeTransaction(data: {
        amount: number;
        currency: string;
        email: string;
        first_name: string;
        last_name: string;
        tx_ref: string;
        callback_url?: string;
        return_url?: string;
    }): Promise<any>;
    verifyTransaction(tx_ref: string): Promise<any>;
}
