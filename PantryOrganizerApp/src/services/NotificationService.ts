import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            alert('Project ID not found');
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log(pushTokenString);
            return pushTokenString;
        } catch (e: unknown) {
            alert(`${e}`);
        }
    } else {
        // alert('Must use physical device for Push Notifications');
        console.log('Must use physical device for Push Notifications');
    }
}

export async function scheduleLocalNotification(title: string, body: string, trigger: Notifications.NotificationTriggerInput) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: 'default',
        },
        trigger,
    });
}

// 1. Expiry Reminder (e.g. 2 days before)
export async function scheduleExpiryReminder(itemName: string, expiryDate: Date) {
    const triggerDate = new Date(expiryDate);
    triggerDate.setDate(triggerDate.getDate() - 2); // 2 days before
    triggerDate.setHours(9, 0, 0, 0); // 9 AM

    if (triggerDate > new Date()) {
        await scheduleLocalNotification(
            'Expiry Alert!',
            `Your ${itemName} is expiring soon. Use it before it goes bad!`,
            { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate }
        );
    }
}

// 2. Low Stock Reminder
export async function scheduleLowStockReminder(itemName: string) {
    // Immediate notification for low stock
    await scheduleLocalNotification(
        'Low Stock Alert!',
        `You are running low on ${itemName}. Add it to your shopping list!`,
        null // specific to immediate
    );
}

// 3. Meal Prep Reminder (Daily for Breakfast, Lunch, Dinner)
export async function scheduleMealPrepReminder() {
    const meals = [
        { label: 'Breakfast', hour: 7, message: 'Start your day right! Check your pantry for breakfast ideas.' },
        { label: 'Lunch', hour: 12, message: 'Mid-day fuel! Time to prep lunch.' },
        { label: 'Dinner', hour: 18, message: 'Time to plan your dinner! Check your pantry for ingredients.' },
    ];

    for (const meal of meals) {
        await scheduleLocalNotification(
            `Meal Prep: ${meal.label}`,
            meal.message,
            {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: meal.hour,
                minute: 0,
                repeats: true,
            }
        );
    }
}

// 4. Shopping List Reminder (Weekly on Saturday 10 AM)
export async function scheduleShoppingListReminder() {
    await scheduleLocalNotification(
        'Shopping Day?',
        'Check your shopping list before you head out!',
        {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: 7, // Saturday
            hour: 10,
            minute: 0,
            repeats: true,
        }
    );
}
