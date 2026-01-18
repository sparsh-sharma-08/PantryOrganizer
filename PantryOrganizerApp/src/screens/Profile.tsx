import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const nav = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Avatar.Image size={96} source={{ uri: 'https://placehold.co/160x160/ff7f50/fff.png?text=U' }} />
      <Text variant="titleLarge" style={{ marginTop: 12, fontWeight: '700' }}>Alex</Text>
      <Text variant="bodyMedium" style={{ color: '#666', marginTop: 6 }}>alex@example.com</Text>

      <Button mode="outlined" onPress={() => nav.goBack()} style={{ marginTop: 20 }}>
        Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
});