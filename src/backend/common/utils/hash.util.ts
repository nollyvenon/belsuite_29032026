import * as bcrypt from 'bcryptjs';

/**
 * Password hashing utility for secure credential storage
 */
export class HashUtil {
  static readonly SALT_ROUNDS = 10;

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Generate random hash for tokens
   */
  static generateRandomHash(): string {
    return require('crypto')
      .randomBytes(32)
      .toString('hex');
  }
}
