import * as React from 'react';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import Home from './src/screens/Home';
import PantryList from './src/screens/PantryList';
import ItemDetail from './src/screens/ItemDetail';
import AddItem from './src/screens/AddItem';
import Header from './src/components/Header';
import Profile from './src/screens/Profile';
import ShoppingList from './src/screens/ShoppingList';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import SplashScreen from './src/screens/SplashScreen';
import SupportScreen from './src/screens/SupportScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import PlannerScreen from './src/screens/PlannerScreen';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ModernTabBar from './src/components/ModernTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function ItemsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ItemsList" component={PantryList} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <>
      <Header />
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={(props) => <ModernTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Items" component={ItemsStack} />
        <Tab.Screen name="CenterPlaceholder" component={Home} options={{ tabBarButton: () => null }} />
        <Tab.Screen name="Plan" component={PlannerScreen} />
        <Tab.Screen name="Shop" component={ShoppingList} />
      </Tab.Navigator>
    </>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="AddItem" component={AddItem} />
      <RootStack.Screen name="ItemDetail" component={ItemDetail} />
      <RootStack.Screen name="Profile" component={Profile} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
      <RootStack.Screen name="Support" component={SupportScreen} />
      <RootStack.Screen name="Family" component={FamilyScreen} />
      <RootStack.Screen name="Stats" component={StatsScreen} />
    </RootStack.Navigator>
  );
}

function RootNavigation() {
  const { user, isLoading } = useAuth();
  const [splashFinished, setSplashFinished] = React.useState(false);

  // Show splash until min time has passed AND auth is ready
  if (isLoading || !splashFinished) {
    return <SplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <RootNavigation />
      </PaperProvider>
    </AuthProvider>
  );
}


