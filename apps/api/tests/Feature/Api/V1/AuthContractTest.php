<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_returns_token_envelope_and_creates_org(): void
    {
        $password = 'Abcd1234!@#$';
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'owner@example.com',
            'password' => $password,
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'organization_name' => 'Test Org',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'accessToken',
                    'refreshToken',
                    'expiresIn',
                    'user' => ['id', 'email', 'firstName', 'lastName'],
                    'organizationId',
                ],
            ])
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.expiresIn', 900);
    }

    public function test_login_returns_401_on_bad_password(): void
    {
        $password = 'Abcd1234!@#$';
        $this->postJson('/api/v1/auth/register', [
            'email' => 'u@example.com',
            'password' => $password,
            'first_name' => 'A',
            'last_name' => 'B',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'u@example.com',
            'password' => 'WrongWrong9!',
        ])->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials');
    }

    public function test_refresh_returns_new_access_token(): void
    {
        $password = 'Abcd1234!@#$';
        $reg = $this->postJson('/api/v1/auth/register', [
            'email' => 'r@example.com',
            'password' => $password,
            'first_name' => 'A',
            'last_name' => 'B',
        ]);
        $refresh = $reg->json('data.refreshToken');

        $res = $this->postJson('/api/v1/auth/refresh', ['refreshToken' => $refresh]);
        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['accessToken', 'refreshToken', 'expiresIn', 'user', 'organizationId']]);
    }
}
