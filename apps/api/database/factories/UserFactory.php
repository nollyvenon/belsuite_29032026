<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    private ?string $passwordHash = null;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $this->passwordHash ??= Hash::make('password');

        return [
            'id' => (string) Str::ulid(),
            'email' => fake()->unique()->safeEmail(),
            'passwordHash' => $this->passwordHash,
            'firstName' => fake()->firstName(),
            'lastName' => fake()->lastName(),
            'timezone' => 'UTC',
            'preferredLanguage' => 'en',
            'status' => 'ACTIVE',
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'emailVerified' => null,
        ]);
    }
}
