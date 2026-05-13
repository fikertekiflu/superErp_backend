import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
export declare class NotificationsService {
    private notificationRepo;
    constructor(notificationRepo: Repository<Notification>);
    getNotificationsForUser(userId: string, tenantId: string): Promise<Notification[]>;
    getUnreadCount(userId: string, tenantId: string): Promise<number>;
    markAsRead(id: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string, tenantId: string): Promise<void>;
}
