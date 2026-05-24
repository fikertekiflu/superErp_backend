import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.chapa.co/v1';

  constructor(private configService: ConfigService) {
    // Correctly load the secret key - either from ENV or use the provided test key directly
    this.secretKey = this.configService.get<string>('CHAPA_SECRET_KEY') || 'CHASECK_TEST-5k3saekZB6yPqljhDWmunmyKKtbkVQoi';
  }

  async initializeTransaction(data: {
    amount: number;
    currency: string;
    email: string;
    first_name: string;
    last_name: string;
    tx_ref: string;
    callback_url?: string;
    return_url?: string;
  }) {
    try {
      this.logger.debug(`Chapa initialize tx_ref=${data.tx_ref}`);
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          ...data,
          customization: {
            title: 'SuperERP',
            description: 'ERP Subscription',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error('Chapa Initialization Error:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Failed to initialize payment with Chapa',
      );
    }
  }

  async verifyTransaction(tx_ref: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      console.error('Chapa Verification Error:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.message || 'Failed to verify payment with Chapa',
      );
    }
  }
}
