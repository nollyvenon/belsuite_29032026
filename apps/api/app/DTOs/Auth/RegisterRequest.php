<?php

namespace App\DTOs\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('firstName') && ! $this->has('first_name')) {
            $merge['first_name'] = $this->input('firstName');
        }
        if ($this->has('lastName') && ! $this->has('last_name')) {
            $merge['last_name'] = $this->input('lastName');
        }
        if ($this->has('organizationName') && ! $this->has('organization_name')) {
            $merge['organization_name'] = $this->input('organizationName');
        }
        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255', 'unique:User,email'],
            'password' => ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:64'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'string', 'max:64'],
        ];
    }
}
