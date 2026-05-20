/**
 * Bitwise permission constants.
 * These must match the backend `roles.permissions` bitmask definitions.
 */
export const Permissions = {
  ADMIN_ACCESS: BigInt(1) << BigInt(0), // Bit 0
  MANAGE_OWN_COURSES: BigInt(1) << BigInt(1), // Bit 1
  ENROLL_AVAILABLE_COURSES: BigInt(1) << BigInt(2), // Bit 2
  MANAGE_OWN_QUESTIONS: BigInt(1) << BigInt(3), // Bit 3
  MANAGE_OWN_TESTS: BigInt(1) << BigInt(4), // Bit 4
  ACCESS_TESTS: BigInt(1) << BigInt(5), // Bit 5
} as const;

/**
 * Check if a user's permissions bitmask includes a specific permission.
 */
export function hasPermission(userPermissions: bigint, permission: bigint): boolean {
  return (userPermissions & permission) !== BigInt(0);
}
