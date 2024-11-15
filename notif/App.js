import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const result = await fetchDataFromAPI();
    return result ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function fetchDataFromAPI() {
  console.log("Fetching data in the background...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
}

async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // Run every 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Push token:", token);
  return token;
}

function HomeScreen({ navigation }) {
  useEffect(() => {
    registerForPushNotificationsAsync();
    registerBackgroundFetchAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      navigation.navigate("Messages");
    });

    return () => subscription.remove();
  }, []);

  const triggerNotification = () => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "New Message! 📬",
        body: 'Tap to read your messages.',
      },
      trigger: { seconds: 2 },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to Your Inbox</Text>
        <Text style={styles.description}>
          Press the button below to simulate receiving a new message.
        </Text>
        <Button title="Simulate Notification" color="#6200ee" onPress={triggerNotification} />
      </View>
    </View>
  );
}

function MessagesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Messages</Text>
        <Text style={styles.messageContent}>This is where your new messages will appear.</Text>
      </View>
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  card: {
    width: '85%',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  messageContent: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
});
