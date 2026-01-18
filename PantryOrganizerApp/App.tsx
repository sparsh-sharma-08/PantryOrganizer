import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text as RNText,
  Platform,
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Home from './src/screens/Home';
import PantryList from './src/screens/PantryList';
import ItemDetail from './src/screens/ItemDetail';
import AddItem from './src/screens/AddItem';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from './src/components/Header';
import Profile from './src/screens/Profile';
import ShoppingList from './src/screens/ShoppingList';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Simple stack for Items tab so ItemDetail/AddItem still work
function ItemsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ItemsList" component={PantryList} />
    </Stack.Navigator>
  );
}

// CustomTabBar removed in favor of ModernTabBar

// add a Root stack that hosts the tabs and profile
const RootStack = createNativeStackNavigator();

import ModernTabBar from './src/components/ModernTabBar';

// replace direct Tab.Navigator export with a MainTabs component and RootStack wrapper
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
        <Tab.Screen name="Shop" component={ShoppingList} />
        <Tab.Screen name="Stats" component={StatsScreen} />
      </Tab.Navigator>
    </>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={MainTabs} />
          {/* expose AddItem / ItemDetail at root so opening them doesn't switch tabs */}
          <RootStack.Screen name="AddItem" component={AddItem} />
          <RootStack.Screen name="ItemDetail" component={ItemDetail} />
          <RootStack.Screen name="Profile" component={Profile} />
        </RootStack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}


