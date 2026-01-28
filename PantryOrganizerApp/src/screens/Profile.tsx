import * as React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Avatar, Surface, Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import storage from '../storage/store';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage as firebaseStorage, db, auth } from '../firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function Profile() {
  const nav = useNavigation<any>();
  const { logout, user } = useAuth();

  const [stats, setStats] = useState({ savedItems: 0, savedMoney: 0 });
  const [uploading, setUploading] = useState(false);
  // Local state to show immediate update before AuthContext refreshes
  const [photo, setPhoto] = useState(user?.photoURL);

  useEffect(() => {
    setPhoto(user?.photoURL);
  }, [user?.photoURL]);

  useEffect(() => {
    const load = async () => {
      const all = await storage.getAll();
      const consumed = all.filter((i: any) => i.consumedAt);
      const count = consumed.length;
      setStats({ savedItems: count, savedMoney: count * 4 });
    };
    load();
    const sub = storage.subscribe(load);
    return () => { sub.remove(); };
  }, []);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Fixed: Removed deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Image picked:', result.assets[0].uri);
        await uploadImage(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Pick error:', e);
      Alert.alert('Error picking image', e.message);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      // 1. Optimize Image (Resize to 800x800, Quality 0.6)
      // This implementation uses the updated expo-image-manipulator API
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Create Blob
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();

      // 3. Upload to Firebase Storage
      const storageRef = ref(firebaseStorage, `profile_images/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      // 4. Get URL
      const downloadURL = await getDownloadURL(storageRef);

      // 5. Update Auth Profile & Firestore
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

      setPhoto(downloadURL);
      Alert.alert('Success', 'Profile picture updated!');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Profile Section */}
      <LinearGradient
        colors={[theme.colors.primary, '#818cf8']}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
          <View>
            <Avatar.Image
              size={80}
              source={{ uri: photo || 'https://i.pravatar.cc/304' }}
              style={[styles.avatar, { opacity: uploading ? 0.5 : 1 }]}
            />
            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {!uploading && (
              <View style={styles.editBadge}>
                <MaterialCommunityIcons name="camera" size={14} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="star-face" size={16} color="#f59e0b" />
          <Text style={styles.badgeText}>Pantry Pro</Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={() => nav.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Impact Stats */}
        <Text style={styles.sectionTitle}>Your Impact</Text>
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={2}>
            <MaterialCommunityIcons name="leaf" size={28} color="#10b981" />
            <Text style={styles.statValue}>{stats.savedItems}</Text>
            <Text style={styles.statLabel}>Items Saved</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={2}>
            <MaterialCommunityIcons name="currency-usd" size={28} color="#f59e0b" />
            <Text style={styles.statValue}>${stats.savedMoney}</Text>
            <Text style={styles.statLabel}>Money Saved</Text>
          </Surface>
        </View>

        {/* Menu Options */}
        <Surface style={styles.menuContainer} elevation={1}>
          <TouchableOpacity style={styles.menuItem} onPress={() => nav.navigate('Settings')}>
            <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
              <MaterialCommunityIcons name="cog" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity style={styles.menuItem} onPress={() => {
            Alert.alert(
              'Export Data',
              'Choose a format for your pantry data:',
              [
                {
                  text: 'CSV (Spreadsheet)', onPress: async () => {
                    const all = await storage.getAll();
                    exportToCSV(all);
                  }
                },
                {
                  text: 'PDF Report', onPress: async () => {
                    const all = await storage.getAll();
                    exportToPDF(all, user?.displayName);
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}>
            <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
              <MaterialCommunityIcons name="file-download-outline" size={24} color="#10b981" />
            </View>
            <Text style={styles.menuText}>Export Data</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity style={styles.menuItem} onPress={() => nav.navigate('Family')}>
            <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.menuText}>Family Sharing</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity style={styles.menuItem} onPress={() => nav.navigate('Stats')}>
            <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
              <MaterialCommunityIcons name="chart-box" size={24} color="#9333ea" />
            </View>
            <Text style={styles.menuText}>Statistics</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
          <Divider />

          <TouchableOpacity style={styles.menuItem} onPress={() => nav.navigate('Support')}>
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="lifebuoy" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        </Surface>

        <Button
          mode="outlined"
          onPress={() => {
            Alert.alert('Logout', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: logout }
            ]);
          }}
          style={styles.logoutBtn}
          textColor={theme.colors.error}
          icon="logout"
        >
          Log Out
        </Button>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  avatar: { borderColor: '#fff', borderWidth: 3, elevation: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 40 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, borderRadius: 12, padding: 4, elevation: 5, borderColor: '#fff', borderWidth: 1 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13, marginLeft: 4 },
  closeBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 20 },

  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12, marginLeft: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    alignItems: 'center', marginHorizontal: 6
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600' },

  menuContainer: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#374151' },

  logoutBtn: { borderColor: theme.colors.error, borderWidth: 1 }
});