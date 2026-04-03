import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileText, CheckCircle, Shield, User, CreditCard, AlertCircle, Scale, BookOpen, Mail, Lock } from 'lucide-react-native';

export default function TermsScreen() {
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

        <Text style={styles.headerTitle}>Terms of Service</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <FileText size={48} color="#F7CD00" />
          </View>
          <Text style={styles.iconText}>Terms of Service</Text>
          <Text style={styles.iconSubtext}>Last updated: January 2025</Text>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          {/* 1. Acceptance of Terms */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <CheckCircle size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            </View>
            <Text style={styles.paragraph}>
              By downloading, installing, or using the Wallpaper app, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          {/* 2. Description of Service */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>2. Description of Service</Text>
            </View>
            <Text style={styles.paragraph}>
              Our app provides access to a collection of wallpapers and digital artwork for personal use.
              We offer both free and premium content to enhance your device's appearance.
            </Text>
          </View>

          {/* 3. User Accounts */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>3. User Accounts</Text>
            </View>
            <Text style={styles.paragraph}>
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activities that occur under your account. You must notify us immediately of any unauthorized use.
            </Text>
          </View>

          {/* 4. Content and Intellectual Property */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>4. Content and Intellectual Property</Text>
            </View>
            <Text style={styles.paragraph}>
              All wallpapers and content provided through our app are protected by copyright and other intellectual
              property laws. You may download and use wallpapers for personal, non-commercial purposes only.
            </Text>
          </View>

          {/* 5. Premium Subscriptions */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <CreditCard size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>5. Premium Subscriptions</Text>
            </View>
            <Text style={styles.paragraph}>
              Premium subscriptions provide access to exclusive content and features. Subscriptions automatically
              renew unless cancelled. You may cancel at any time through your account settings.
            </Text>
          </View>

          {/* 6. User Conduct */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>6. User Conduct</Text>
            </View>
            <Text style={styles.paragraph}>
              You agree not to use our service for any unlawful purpose or in any way that could damage,
              disable, or impair our service. This includes uploading inappropriate content or violating others' rights.
            </Text>
          </View>

          {/* 7. Privacy */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Lock size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>7. Privacy</Text>
            </View>
            <Text style={styles.paragraph}>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect,
              use, and protect your information.
            </Text>
          </View>

          {/* 8. Disclaimers */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>8. Disclaimers</Text>
            </View>
            <Text style={styles.paragraph}>
              Our service is provided "as is" without warranties of any kind. We do not guarantee that our
              service will be uninterrupted, error-free, or completely secure.
            </Text>
          </View>

          {/* 9. Limitation of Liability */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Scale size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
            </View>
            <Text style={styles.paragraph}>
              In no event shall we be liable for any indirect, incidental, special, or consequential damages
              arising out of or in connection with your use of our service.
            </Text>
          </View>

          {/* 10. Changes to Terms */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
            </View>
            <Text style={styles.paragraph}>
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes through the app or via email. Continued use of the service constitutes acceptance of updated terms.
            </Text>
          </View>

          {/* 11. Contact Information */}
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <Mail size={20} color="#F7CD00" />
              <Text style={styles.sectionTitle}>11. Contact Information</Text>
            </View>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms of Service, please contact us at legal@wallpaperapp.com
              or through our Help Center.
            </Text>
          </View>
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
  iconSection: {
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F7CD00',
  },
  iconText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A3A9E',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  iconSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  contentCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionWrapper: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A3A9E',
    letterSpacing: 0.3,
  },
  paragraph: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    paddingLeft: 30,
  },
  bottomPadding: {
    height: 40,
  },
});