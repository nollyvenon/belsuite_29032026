<?php

namespace App\Modules\Auth\Support;

use App\Models\User;
use DateTimeInterface;

final class AuthUserResource
{
    /**
     * @return array<string, mixed>
     */
    public static function toArray(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'avatar' => $user->avatar ?? null,
            'phoneNumber' => $user->phoneNumber,
            'timezone' => $user->timezone,
            'preferredLanguage' => $user->preferredLanguage,
            'status' => $user->status,
            'lastLogin' => self::iso($user->lastLogin ?? null),
            'emailVerified' => self::iso($user->emailVerified ?? null),
            'createdAt' => self::iso($user->createdAt),
            'updatedAt' => self::iso($user->updatedAt),
            'deletedAt' => self::iso($user->deletedAt ?? null),
        ];
    }

    private static function iso(null|DateTimeInterface|string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if ($value instanceof DateTimeInterface) {
            return $value->format(DateTimeInterface::ATOM);
        }

        return (string) $value;
    }
}
