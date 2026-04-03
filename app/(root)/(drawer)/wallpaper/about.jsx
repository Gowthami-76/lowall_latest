import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Star, Mail, Globe, Shield, Code, Sparkles, Award, Zap } from 'lucide-react-native';

export default function AboutScreen() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@wallpaperapp.com');
  };

  const handleWebsitePress = () => {
    Linking.openURL('https://wallpaperapp.com');
  };

  const handleRatePress = () => {
    // This would open the app store for rating
    Linking.openURL('https://apps.apple.com/app/wallpaper-app');
  };

  const InfoCard = ({ icon: Icon, title, description, onPress }) => (
    <TouchableOpacity
      style={styles.infoCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.infoCardIcon}>
        <Icon size={22} color="#0A3A9E" />
      </View>
      <View style={styles.infoCardContent}>
        <Text style={styles.infoCardTitle}>{title}</Text>
        <Text style={styles.infoCardDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>About</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=200' }}
              style={styles.appLogo}
            />
          </View>

          <Text style={styles.appName}>Wallpaper Gallery</Text>
          <Text style={styles.appSlogan}>Beautiful wallpapers for your device</Text>

          <View style={styles.versionContainer}>
            <Sparkles size={14} color="#F7CD00" />
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionNumber}>1.0.0</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>High-quality wallpapers in 4K resolution</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Multiple categories and collections</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Download and set as wallpaper instantly</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Create and manage your favorites</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Regular updates with new wallpapers</Text>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>

          <InfoCard
            icon={Mail}
            title="Email Support"
            description="Get help from our support team"
            onPress={handleEmailPress}
          />

          <InfoCard
            icon={Globe}
            title="Visit Website"
            description="Learn more about our app"
            onPress={handleWebsitePress}
          />

          <InfoCard
            icon={Star}
            title="Rate Our App"
            description="Share your feedback on the App Store"
            onPress={handleRatePress}
          />
        </View>

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>

          <View style={styles.developerCard}>
            <View style={styles.developerIcon}>
              <Code size={24} color="#F7CD00" />
            </View>

            <View style={styles.developerInfo}>
              <Text style={styles.developerName}>Wallpaper Studio</Text>
              <Text style={styles.developerDescription}>
                We are passionate about creating beautiful mobile experiences.
                Our team works hard to bring you the best wallpapers from around the world.
              </Text>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <InfoCard
            icon={Shield}
            title="Privacy Policy"
            description="How we protect your data"
            onPress={() => router.push('/wallpaper/privacy')}
          />

          <InfoCard
            icon={Shield}
            title="Terms of Service"
            description="Terms and conditions of use"
            onPress={() => router.push('/wallpaper/terms')}
          />
        </View>

        {/* Made with Love */}
        <View style={styles.loveSection}>
          <View style={styles.loveContainer}>
            <Text style={styles.loveText}>Made with</Text>
            <Heart size={16} color="#EF4444" fill="#EF4444" />
            <Text style={styles.loveText}>in India</Text>
            <Award size={16} color="#F7CD00" />
          </View>

          <Text style={styles.copyrightText}>
            © 2024 Wallpaper Studio. All rights reserved.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0A3A9E',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  appLogo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  appSlogan: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F7CD00',
  },
  versionLabel: {
    fontSize: 13,
    color: '#0A3A9E',
    fontWeight: '600',
  },
  versionNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F7CD00',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  featuresList: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F7CD00',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3A9E',
    marginBottom: 4,
  },
  infoCardDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  developerCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  developerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
  },
  developerDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loveSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  loveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  loveText: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 2,
    fontWeight: '500',
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});