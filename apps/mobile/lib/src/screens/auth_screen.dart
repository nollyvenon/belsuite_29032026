import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../store/app_session_store.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.sessionStore, required this.onAuthenticated});

  final AppSessionStore sessionStore;
  final VoidCallback onAuthenticated;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _resetToken = TextEditingController();
  final _newPassword = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _isRegister = false;
  bool _isForgot = false;
  bool _isReset = false;

  late final BelsuiteApiClient _api;

  @override
  void initState() {
    super.initState();
    _api = widget.sessionStore.apiClient;
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.postJson('/api/auth/login', {
        'email': _email.text.trim(),
        'password': _password.text,
      });
      final accessToken = (res['accessToken'] ?? '').toString();
      if (accessToken.isEmpty) {
        throw Exception('Login failed');
      }
      widget.sessionStore.setAccessToken(accessToken);
      widget.onAuthenticated();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _register() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.postJson('/api/auth/register', {
        'email': _email.text.trim(),
        'password': _password.text,
        'firstName': _firstName.text.trim(),
        'lastName': _lastName.text.trim(),
      });
      final accessToken = (res['accessToken'] ?? '').toString();
      if (accessToken.isEmpty) throw Exception('Registration failed');
      widget.sessionStore.setAccessToken(accessToken);
      widget.onAuthenticated();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _forgotPassword() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _api.postJson('/api/auth/password/forgot', {
        'email': _email.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('If the email exists, reset instructions were issued.')),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resetPassword() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _api.postJson('/api/auth/password/reset', {
        'token': _resetToken.text.trim(),
        'newPassword': _newPassword.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password has been reset. You can now sign in.')),
        );
      }
      setState(() {
        _isReset = false;
        _isForgot = false;
        _isRegister = false;
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Belsuite Auth')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            const SizedBox(height: 8),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 10),
            if (_isRegister) ...[
              TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name')),
              const SizedBox(height: 10),
              TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name')),
              const SizedBox(height: 10),
            ],
            if (!_isForgot && !_isReset) ...[
              TextField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Password'),
              ),
              const SizedBox(height: 12),
            ],
            if (_isReset) ...[
              TextField(controller: _resetToken, decoration: const InputDecoration(labelText: 'Reset token')),
              const SizedBox(height: 10),
              TextField(
                controller: _newPassword,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'New password'),
              ),
              const SizedBox(height: 12),
            ],
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),
            FilledButton(
              onPressed: _loading
                  ? null
                  : _isReset
                      ? _resetPassword
                      : _isForgot
                          ? _forgotPassword
                          : _isRegister
                              ? _register
                              : _login,
              child: Text(
                _loading
                    ? 'Please wait...'
                    : _isReset
                        ? 'Reset Password'
                        : _isForgot
                            ? 'Send Reset Link'
                            : _isRegister
                                ? 'Create Account'
                                : 'Sign In',
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: _loading
                  ? null
                  : () => setState(() {
                        _isRegister = !_isRegister;
                        _isForgot = false;
                        _isReset = false;
                      }),
              child: Text(_isRegister ? 'Have an account? Sign in' : 'Create new account'),
            ),
            TextButton(
              onPressed: _loading
                  ? null
                  : () => setState(() {
                        _isForgot = !_isForgot;
                        _isRegister = false;
                        _isReset = false;
                      }),
              child: const Text('Forgot password'),
            ),
            TextButton(
              onPressed: _loading
                  ? null
                  : () => setState(() {
                        _isReset = !_isReset;
                        _isForgot = false;
                        _isRegister = false;
                      }),
              child: const Text('Have reset token? Reset password'),
            ),
          ],
        ),
      ),
    );
  }
}
