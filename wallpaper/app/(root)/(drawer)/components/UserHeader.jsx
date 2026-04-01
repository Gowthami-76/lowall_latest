import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
export default function UserHeader({
  loading,
  userData,
  showEmail = true,
  onProfilePress,
  onLogout,
}) {

   

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
      <Image
        source={{
          uri:
            userData?.avatar ||
            'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
        }}
        style={styles.avatar}
      />

      <Text style={styles.name}>
        {userData?.fullName ||
          `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}` ||
          'User'}
      </Text>
      </TouchableOpacity>

     
        <Text style={styles.email}>
          {userData?.email || ''}
        </Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  email: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  logoutBtn: {
  marginTop: 16,
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 20,
  backgroundColor: '#FEE2E2',
},
logoutText: {
  color: '#DC2626',
  fontWeight: '600',
  fontSize: 14,
},
});
