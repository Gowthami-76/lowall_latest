import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import UserHeader from './components/UserHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function CustomDrawerContent(props) {
  console.log('🟢 CustomDrawerContent rendered');

  const [userData, setUserData] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    console.log('🔄 refreshAuth called');
    try {
      setLoading(true);
      console.log('⏳ Loading started');

      const token = await AsyncStorage.getItem('authToken');
      console.log('🔑 Token retrieved:', token ? '✅ exists' : '❌ null');

      if (!token) {
        console.log('❌ No token found, setting hasToken=false');
        setHasToken(false);
        setUserData(null);
        return;
      }

      setHasToken(true);
      console.log('✅ Token found, hasToken=true');

      const storedUser = await AsyncStorage.getItem('userProfile');
      console.log('👤 User profile retrieved:', storedUser ? '✅ exists' : '❌ null');
      
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      console.log('📝 Parsed user data:', parsedUser);
      
      setUserData(parsedUser);
    } catch (e) {
      console.log('❌ Drawer auth error:', e);
      setHasToken(false);
      setUserData(null);
    } finally {
      setLoading(false);
      console.log('✅ Loading finished');
    }
  };

  useEffect(() => {
    console.log('🎬 useEffect - Initial setup');
    
    // ✅ Initial render
    refreshAuth();

    const { navigation } = props;

    if (!navigation) {
      console.warn('⚠️ Navigation is undefined');
      return;
    }

    // 🔁 Drawer state changes
    const stateUnsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      const isOpen = state?.history?.some(item => item.type === 'drawer');
      console.log('🚪 Drawer state changed, isOpen:', isOpen);
      
      if (isOpen) {
        console.log('🔄 Drawer opened, refreshing auth');
        refreshAuth();
      }
    });

    console.log('🎧 Event listeners attached');

    return () => {
      console.log('🧹 Cleaning up event listeners');
      stateUnsubscribe();
    };
  }, [props.navigation]);

  // 🚪 Logout
  const handleLogout = async () => {
    console.log('🚪 Logout initiated');
    
    await AsyncStorage.multiRemove([
      'authToken',
      'userId',
      'userData',
      'userProfile',
    ]);
    
    console.log('🗑️ AsyncStorage cleared');

    setHasToken(false);
    setUserData(null);
    console.log('📊 State reset: hasToken=false, userData=null');

    props.navigation?.closeDrawer();
    console.log('🚪 Drawer closed');
    
    // router.replace('/auth/login');
    // console.log('🔀 Navigated to login');
  };

  // 🎯 Render
  console.log('🎨 Rendering with:', { hasToken, userData: userData ? '✅' : '❌', loading });

  return (
    <View style={styles.drawerContainer}>
      {!hasToken ? (
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>Please login</Text>
          <TouchableOpacity
            onPress={() => {
              console.log('🔗 "Go to Login" pressed');
              props.navigation?.closeDrawer();
              router.replace('/auth/login');
            }}
          >
            <Text style={styles.loginLink}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <UserHeader
          loading={false}
          userData={userData}
          showEmail={false}
          onProfilePress={() => {
            console.log('👤 Profile pressed');
            props.navigation?.closeDrawer();
          }}
          onLogout={handleLogout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginText: {
    fontSize: 16,
    color: '#333',
  },
  loginLink: {
    color: 'blue',
    marginTop: 10,
    fontSize: 16,
  },
});

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          swipeEnabled: true,
          drawerStyle: {
            width: 280,
            backgroundColor: 'white',
          },
          overlayColor: 'rgba(0,0,0,0.5)',
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{ 
            drawerItemStyle: { display: 'none' },
            title: 'Home'
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
