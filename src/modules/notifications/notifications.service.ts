import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async getNotificationsForUser(userId: string, tenantId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { user: { id: userId }, tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { user: { id: userId }, tenant: { id: tenantId }, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationRepo.update(id, { isRead: true });
    const result = await this.notificationRepo.findOne({ where: { id } });
    return result!;
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationRepo.update(
      { user: { id: userId }, tenant: { id: tenantId }, isRead: false },
      { isRead: true },
    );
  }
}
