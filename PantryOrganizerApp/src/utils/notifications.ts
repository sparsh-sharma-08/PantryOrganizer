import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    return true;
}

export async function scheduleExpiryNotification(
    itemName: string,
    expiryDate: Date,
    daysBefore: number = 7
): Promise<string | null> {
    const triggerDate = new Date(expiryDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);

    // If the trigger date is in the past, don't schedule
    if (triggerDate.getTime() < Date.now()) {
        console.log(`Skipping notification for ${itemName}: trigger date is in the past.`);
        return null;
    }

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Pantry Alert 🍎",
                body: `${itemName} is expiring soon! Use it before it goes bad.`,
                sound: 'default',
                data: { type: 'expiry', itemName },
            },
            trigger: {
                date: triggerDate, // Schedule for specific date
                type: Notifications.SchedulableTriggerInputTypes.DATE,
            },
        });
        console.log(`Scheduled notification ${id} for ${itemName} on ${triggerDate.toDateString()}`);
        return id;
    } catch (e) {
        console.warn("Failed to schedule notification:", e);
        return null;
    }
}

export async function cancelNotification(notificationId: string) {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        console.log(`Cancelled notification ${notificationId}`);
    } catch (e) {
        console.warn("Failed to cancel notification:", e);
    }
}

export async function getAllScheduled() {
    return await Notifications.getAllScheduledNotificationsAsync();
}
