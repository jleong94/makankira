import 'package:flutter/material.dart';

/// Shown only while the session check (`/auth/me`) is in flight, so neither the
/// dashboard nor the login form flashes before we know whether the user is
/// signed in. The router replaces it with /login or the destination once the
/// check resolves.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.ramen_dining, size: 64),
            SizedBox(height: 24),
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 3),
            ),
          ],
        ),
      ),
    );
  }
}
