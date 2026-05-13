import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<import("./notification.entity").Notification[]>;
    getUnreadCount(req: any): Promise<number>;
    markAsRead(id: string, req: any): Promise<import("./notification.entity").Notification>;
    markAllAsRead(req: any): Promise<void>;
}
