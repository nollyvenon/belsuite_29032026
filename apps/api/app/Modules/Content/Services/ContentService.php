<?php

namespace App\Modules\Content\Services;

use App\Models\Content\ContentItem;
use Illuminate\Support\Str;

class ContentService
{
    public function list(string $organizationId, array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = min(100, max(1, (int) ($query['limit'] ?? 20)));
        $q = ContentItem::query()->where('organizationId', $organizationId);
        if (! empty($query['status'])) {
            $q->where('status', (string) $query['status']);
        }
        $total = (clone $q)->count();
        $items = $q->orderByDesc('updatedAt')->forPage($page, $limit)->get();

        return ['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit];
    }

    public function create(string $organizationId, string $creatorId, array $data): ContentItem
    {
        $slug = $this->uniqueSlug($organizationId, (string) ($data['slug'] ?? Str::slug($data['title'])));

        return ContentItem::query()->create([
            'id' => (string) Str::ulid(),
            'organizationId' => $organizationId,
            'type' => (string) ($data['type'] ?? 'ARTICLE'),
            'title' => (string) $data['title'],
            'description' => $data['description'] ?? null,
            'slug' => $slug,
            'content' => $data['content'] ?? null,
            'creatorId' => $creatorId,
            'status' => $data['status'] ?? 'DRAFT',
            'tags' => $data['tags'] ?? null,
            'thumbnail' => $data['thumbnail'] ?? null,
        ]);
    }

    public function find(string $organizationId, string $id): ?ContentItem
    {
        return ContentItem::query()->where('organizationId', $organizationId)->where('id', $id)->first();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ContentItem $item, array $data): ContentItem
    {
        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug((string) $item->organizationId, (string) $data['slug'], $item->id);
        }
        $item->fill($data)->save();

        return $item->fresh();
    }

    public function delete(ContentItem $item): void
    {
        $item->delete();
    }

    private function uniqueSlug(string $organizationId, string $base, ?string $ignoreId = null): string
    {
        $slug = Str::limit(Str::slug($base), 240, '');
        if ($slug === '') {
            $slug = 'content';
        }
        $candidate = $slug;
        $i = 0;
        while (ContentItem::query()
            ->where('organizationId', $organizationId)
            ->where('slug', $candidate)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $candidate = $slug.'-'.(++$i);
        }

        return $candidate;
    }
}
