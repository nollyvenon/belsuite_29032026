import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'notification_service.dart';

class PushNotificationService {
  PushNotificationService._();
  static final instance = PushNotificationService._();

  Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      await FirebaseMessaging.instance.requestPermission(alert: true, badge: true, sound: true);
      FirebaseMessaging.onMessage.listen((message) {
        final title = message.notification?.title ?? 'Belsuite';
        final body = message.notification?.body ?? 'New update available';
        NotificationService.instance.showBasic(title: title, body: body);
      });
    } catch (_) {
      // Firebase may be unavailable in local environments.
    }
  }
}
